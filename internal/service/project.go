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
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	project.ID = primitive.NewObjectID()
	project.OwnerID = user.ID

	_, err := collection.InsertOne(ctx, project)
	if err != nil {
		log.Errorf("Failed to insert project into DB: %v", err)
		return nil, err
	}

	if err := increaseProjectSize(project.OwnerID); err != nil {
		log.Errorf("Failed to increase project size: %v", err)
		return nil, err
	}

	projectLogId := primitive.NewObjectID()
	projectLog := models.ProjectLog{
		ID:        projectLogId,
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
	log.Debugf("Project found: %+v", project)

	if !user.IsAdmin && project.OwnerID != user.ID {
		log.Warnf("Unauthorized delete attempt by user %s on project %s", user.ID.Hex(), objID.Hex())
		return fmt.Errorf("unauthorized: only owner or admin can delete")
	}

	res, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		log.WithError(err).Error("Failed to delete project")
		return err
	}

	log.Infof("Project deleted successfully: %s, deletedCount=%d", objID.Hex(), res.DeletedCount)
	return nil
}

func increaseProjectSize(ownerID primitive.ObjectID) error {
	log.Debugf("increaseProjectSize called for ownerID=%s", ownerID.Hex())

	us := GetUserService()
	collection := database.DB.Collection(us.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$inc": bson.M{"project_size": 1},
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

func (s *ProjectService) GetProject(projectID primitive.ObjectID, user *models.User) (*models.Project, error) {

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var project models.Project
	err := collection.FindOne(ctx, bson.M{
		"_id": projectID,
		"$or": []bson.M{
			{"owner_id": user.ID},
			{"team": user.ID},
		},
	}).Decode(&project)

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

	cursor, err := collection.Find(ctx, bson.M{"owner_id": userObjID})
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

	if projects == nil {
		projects = []*models.Project{}
	}

	return projects, nil
}
