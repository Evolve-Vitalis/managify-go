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

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	isProjectValid, err := projectService.IsProjectValid(issue.ProjectID)
	if err != nil {
		return nil, err
	}
	if !isProjectValid {
		return nil, fmt.Errorf("project is not valid")
	}

	isUserInProject, err := projectService.IsUserInProject(userID, issue.ProjectID)
	if err != nil {
		return nil, err
	}
	if !isUserInProject {
		return nil, fmt.Errorf("user is not in project")
	}

	isStatusValid, err := statusService.IsStatusInProject(issue.StatusID, issue.ProjectID)
	if err != nil {
		return nil, err
	}
	if !isStatusValid {
		return nil, fmt.Errorf("status is not part of the project")
	}

	issue.ID = primitive.NewObjectID()

	_, err = collection.InsertOne(ctx, issue)
	if err != nil {
		log.Errorf("Failed to insert issue into DB: %v", err)
		return nil, err
	}
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
