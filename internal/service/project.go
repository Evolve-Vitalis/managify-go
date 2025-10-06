package service

import (
	"context"
	"fmt"

	"managify/database"

	"managify/models"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProjectService struct {
	Collection string
}

var projectService *ProjectService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetProjectService() *ProjectService {
	if projectService == nil {
		projectService = &ProjectService{Collection: "projects"}
	}
	return projectService
}

func (s *ProjectService) CreateProject(project *models.Project, user *models.User) (*models.Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	userColl := database.DB.Collection("users")
	projectColl := database.DB.Collection(s.Collection)
	subColl := database.DB.Collection("subscriptions")

	var subscription models.Subscription
	if err := subColl.FindOne(ctx, bson.M{"user_id": user.ID, "is_valid": true}).Decode(&subscription); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("no active subscription found")
		}
		return nil, fmt.Errorf("failed to check subscription: %w", err)
	}

	filter := bson.M{"_id": user.ID}
	if subscription.PlanType == models.PlanBasic {
		filter["project_size"] = bson.M{"$lt": 3}
	}

	update := bson.M{"$inc": bson.M{"project_size": 1}}
	res, err := userColl.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("failed to update project size: %w", err)
	}

	if res.ModifiedCount == 0 {
		return nil, fmt.Errorf("plan limit reached: BASIC users can only create up to 3 projects")
	}

	project.ID = primitive.NewObjectID()
	project.OwnerID = user.ID

	if _, err := projectColl.InsertOne(ctx, project); err != nil {

		_, err = userColl.UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{"$inc": bson.M{"project_size": -1}})
		return nil, fmt.Errorf("failed to insert project: %w", err)
	}

	projectLog := models.ProjectLog{
		ID:        primitive.NewObjectID(),
		ProjectID: project.ID.Hex(),
		UserID:    user.ID.Hex(),
		Message:   "Project has been created",
		Timestamp: time.Now(),
	}
	if err := GetLogService().CreateLog(&projectLog); err != nil {
		return nil, err
	}

	return project, nil
}

func reduceProjectSize(ownerID primitive.ObjectID) error {
	log.Debugf("reduceProjectSize called for ownerID=%s", ownerID.Hex())

	us := GetUserService()
	collection := database.DB.Collection(us.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$inc": bson.M{"project_size": -1},
	}

	res, err := collection.UpdateOne(ctx, bson.M{"_id": ownerID}, update)
	if err != nil {
		log.WithError(err).Error("Failed to update project_size")
		return fmt.Errorf("failed to update project size: %v", err)
	}

	if res.MatchedCount == 0 {
		log.Warnf("User not found while increasing project size: %s", ownerID.Hex())
		return fmt.Errorf("user not found")
	}

	log.Infof("Project size increased for user %s, matchedCount=%d, modifiedCount=%d", ownerID.Hex(), res.MatchedCount, res.ModifiedCount)
	return nil
}

func (s *ProjectService) DeleteProjectById(objID primitive.ObjectID, user *models.User) error {
	log.Debugf("DeleteProjectById called with objID=%s, userID=%s", objID.Hex(), user.ID.Hex())

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var project models.Project
	err := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&project)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Warnf("Project not found: %s", objID.Hex())
			return fmt.Errorf("project not found")
		}
		log.WithError(err).Error("Error finding project")
		return err
	}

	if !user.IsAdmin && project.OwnerID != user.ID {
		log.Warnf("Unauthorized delete attempt by user %s on project %s", user.ID.Hex(), objID.Hex())
		return fmt.Errorf("unauthorized: only owner or admin can delete")
	}

	res, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		log.WithError(err).Error("Failed to delete project")
		return err
	}

	reduceProjectSize(project.OwnerID)

	log.Infof("Project deleted successfully: %s, deletedCount=%d", objID.Hex(), res.DeletedCount)
	return nil
}

func (s *ProjectService) GetProject(projectID primitive.ObjectID, user *models.User) (*models.Project, error) {

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	log.Infof("Searching project %s for user %s", projectID.Hex(), user.ID.Hex())

	var project models.Project
	err := collection.FindOne(ctx, bson.M{
		"_id": projectID,
		"$or": []bson.M{
			{"owner_id": user.ID},
			{"team": bson.M{"$in": []primitive.ObjectID{user.ID}}},
		},
	}).Decode(&project)

	fmt.Println(err)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Warnf("project not found or access denied for user %s", user.ID.Hex())
			return nil, fmt.Errorf("project not found or access denied")
		}
		log.WithError(err).Error("failed to fetch project")
		return nil, err
	}

	log.Infof("project fetched successfully: %s by user %s", projectID.Hex(), user.ID.Hex())
	return &project, nil
}

func (s *ProjectService) IsProjectValid(projectID primitive.ObjectID) (bool, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var project models.Project
	err := collection.FindOne(ctx, bson.M{"_id": projectID}).Decode(&project)
	if err != nil {
		log.WithError(err).Error("failed to fetch project")
		return false, err
	}

	return true, nil

}

func (s *ProjectService) IsUserInProject(userID, projectID primitive.ObjectID) (bool, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"_id": projectID,
		"$or": []bson.M{
			{"owner_id": userID},
			{"team": userID},
		},
	}

	count, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		log.WithError(err).Error("failed to check if user is in project")
		return false, err
	}

	return count > 0, nil
}
func (s *ProjectService) GetProjectsByUserId(userIDHex string) ([]*models.Project, error) {
	userObjID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, err
	}

	collection := database.DB.Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"$or": []bson.M{
			{"owner_id": userObjID},
			{"team": bson.M{"$in": []primitive.ObjectID{userObjID}}},
		},
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []*models.Project
	for cursor.Next(ctx) {
		var project models.Project
		if err := cursor.Decode(&project); err != nil {
			return nil, err
		}
		projects = append(projects, &project)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	if projects == nil {
		projects = []*models.Project{}
	}

	log.Infof("Fetched %d projects for user %s", len(projects), userObjID.Hex())

	return projects, nil
}

func (s *ProjectService) GetProjectWithTeam(projectID primitive.ObjectID, user *models.User) (*models.Project, []models.User, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var project models.Project
	err := collection.FindOne(ctx, bson.M{
		"_id": projectID,
		"$or": []bson.M{
			{"owner_id": user.ID},
			{"team": bson.M{"$in": []primitive.ObjectID{user.ID}}},
		},
	}, options.FindOne().SetProjection(bson.M{
		"password": 0,
	})).Decode(&project)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil, fmt.Errorf("project not found or access denied")
		}
		return nil, nil, err
	}

	var teamMembers []models.User
	if len(project.TeamIDs) > 0 {
		userCollection := database.DB.Collection("users")
		cursor, err := userCollection.Find(ctx, bson.M{"_id": bson.M{"$in": project.TeamIDs}})
		if err == nil {
			defer cursor.Close(ctx)
			for cursor.Next(ctx) {
				var member models.User
				if err := cursor.Decode(&member); err == nil {
					teamMembers = append(teamMembers, member)
				}
			}
		}
	}

	return &project, teamMembers, nil
}

func (s *ProjectService) DeleteMemberFromProjectById(userId, memberId primitive.ObjectID) error {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var project models.Project
	err := collection.FindOne(ctx, bson.M{"owner_id": userId}).Decode(&project)
	if err != nil {
		log.WithError(err).Error("failed to fetch project")
		return err
	}

	res, err := collection.UpdateOne(
		ctx,
		bson.M{"owner_id": userId},
		bson.M{"$pull": bson.M{"team": memberId}},
	)

	if err != nil {
		log.WithError(err).Error("failed to fetch project")
		return err
	}

	if res.ModifiedCount == 0 {
		return err
	}

	return nil

}
