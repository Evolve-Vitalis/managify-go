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

type IssueService struct {
	Collection string
}

var issueService *IssueService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetIssueService() *IssueService {
	if issueService == nil {
		issueService = &IssueService{Collection: "issues"}
	}
	return issueService
}

func (s *IssueService) CreateIssue(issue *models.Issue, userID primitive.ObjectID) (*models.Issue, error) {
	log.Info("You are in create issue service.")

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Project validation
	isProjectValid, err := GetProjectService().IsProjectValid(issue.ProjectID)
	if err != nil {
		return nil, err
	}
	if !isProjectValid {
		return nil, fmt.Errorf("project is not valid")
	}

	// User validation
	isUserInProject, err := GetProjectService().IsUserInProject(userID, issue.ProjectID)
	if err != nil {
		return nil, err
	}
	if !isUserInProject {
		return nil, fmt.Errorf("user is not in project")
	}

	logrus.Info("status id", issue.StatusID)

	issue.ID = primitive.NewObjectID()

	res, err := collection.InsertOne(ctx, issue)
	if err != nil {
		log.Errorf("Failed to insert issue into DB: %v", err)
		return nil, err
	}
	log.Infof("Inserted issue ID: %v", res.InsertedID)

	projectLogId := primitive.NewObjectID()
	projectLog := models.ProjectLog{
		ID:        projectLogId,
		ProjectID: issue.ProjectID.Hex(),
		UserID:    userID.Hex(),
		Message:   "Issue Has Been Created -> " + issue.Title,
		Timestamp: time.Now(),
	}
	if err := GetLogService().CreateLog(&projectLog); err != nil {
		return nil, err
	}

	log.Infof(issue.Description)

	return issue, nil
}
func (s *IssueService) DeleteIssue(issueID, userID primitive.ObjectID) error {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var issue models.Issue
	err := collection.FindOne(ctx, bson.M{"_id": issueID}).Decode(&issue)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return fmt.Errorf("issue not found")
		}
		return err
	}

	isUserInProject, err := projectService.IsUserInProject(userID, issue.ProjectID)
	if err != nil {
		return err
	}
	if !isUserInProject {
		return fmt.Errorf("user is not allowed to delete this issue")
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": issueID})
	if err != nil {
		log.Errorf("Failed to delete issue from DB: %v", err)
		return err
	}
	return nil
}
func (s *IssueService) GetIssuesByStatusID(statusID primitive.ObjectID) ([]*models.Issue, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"status_id": statusID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var issues []*models.Issue
	for cursor.Next(ctx) {
		var issue models.Issue
		if err := cursor.Decode(&issue); err != nil {
			return nil, err
		}
		issues = append(issues, &issue)
	}

	return issues, nil
}

func (s *IssueService) UpdateIssueStatus(issueID, newStatusID, userID primitive.ObjectID) (*models.Issue, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fmt.Println("issueID ->" + issueID.Hex())
	fmt.Println("newStatusID ->" + newStatusID.Hex())

	var issue models.Issue
	if err := collection.FindOne(ctx, bson.M{"_id": issueID}).Decode(&issue); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("issue not found")
		}
		return nil, err
	}

	update := bson.M{
		"$set": bson.M{
			"status_id":  newStatusID,
			"updated_at": time.Now(),
		},
	}
	res, err := collection.UpdateOne(ctx, bson.M{"_id": issueID}, update)
	if err != nil {
		return nil, fmt.Errorf("failed to update issue status: %w", err)
	}
	fmt.Println("Matched:", res.MatchedCount, "Modified:", res.ModifiedCount)
	if res.MatchedCount == 0 {
		return nil, fmt.Errorf("no matching issue found to update")
	}

	fmt.Println(res.ModifiedCount)

	projectLog := models.ProjectLog{
		ID:        primitive.NewObjectID(),
		ProjectID: issue.ProjectID.Hex(),
		UserID:    userID.Hex(),
		Message:   fmt.Sprintf("Issue '%s' status changed to new status", issue.Title),
		Timestamp: time.Now(),
	}
	if err := GetLogService().CreateLog(&projectLog); err != nil {
		return nil, err
	}

	fmt.Println(projectLog)

	issue.StatusID = newStatusID

	fmt.Println(issue)
	return &issue, nil
}
