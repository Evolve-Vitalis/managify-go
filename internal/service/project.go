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
)

type ProjectService struct {
	Collection string
}

var projectService *ProjectService

func GetProjectService() *ProjectService {
	if projectService == nil {
		projectService = &ProjectService{Collection: "projects"}
	}
	return projectService
}

func (s *ProjectService) CreateProject(project *models.Project) (*models.Project, error) {
	var log = logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	project.ID = primitive.NewObjectID()

	_, err := collection.InsertOne(ctx, project)
	if err != nil {
		log.Errorf("Failed to insert project into DB: %v", err)
		return nil, err
	}

	if err := increaseProjectSize(project.OwnerID); err != nil {
		log.Errorf("Failed to increase project size: %v", err)
		return nil, err
	}

	return project, nil
}
func increaseProjectSize(ownerID primitive.ObjectID) error {
	us := GetUserService()
	collection := database.DB.Collection(us.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$inc": bson.M{"project_size": 1},
	}

	res, err := collection.UpdateOne(ctx, bson.M{"_id": ownerID}, update)
	if err != nil {
		return fmt.Errorf("failed to update project size: %v", err)
	}

	if res.MatchedCount == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
