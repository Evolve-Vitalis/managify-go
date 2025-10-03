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

type StatusService struct {
	Collection string
}

var statusService *StatusService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetStatusService() *StatusService {
	if statusService == nil {
		statusService = &StatusService{Collection: "status"}
	}
	return statusService
}

func (s *StatusService) CreateStatus(status *models.Status) (*models.Status, error) {
	ps := GetProjectService()

	projectValid, err := ps.IsProjectValid(status.ProjectID)
	if err != nil || !projectValid {
		return nil, err
	}

	exists, err := ps.IsUserInProject(status.CreatorID, status.ProjectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user is not part of the project")
	}

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	status.CreatedAt = time.Now()
	status.UpdatedAt = time.Now()

	res, err := collection.InsertOne(ctx, status)
	if err != nil {
		log.WithError(err).Error("failed to insert status")
		return nil, err
	}

	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		status.ID = oid
	}

	projectLogId := primitive.NewObjectID()
	projectLog := models.ProjectLog{
		ID:        projectLogId,
		ProjectID: status.ProjectID.Hex(),
		UserID:    status.ID.Hex(),
		Message:   "Status has been added -> " + status.Name,
		Timestamp: time.Now(),
	}
	if err := GetLogService().CreateLog(&projectLog); err != nil {
		return nil, err
	}
	return status, nil
}

func (s *StatusService) DeleteStatus(deleteId primitive.ObjectID, projectId primitive.ObjectID, userId primitive.ObjectID) error {
	ps := GetProjectService()
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := ps.IsUserInProject(userId, projectId)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("user is not part of the project")
	}

	res, err := collection.DeleteOne(ctx, bson.M{"_id": deleteId})
	if err != nil {
		log.WithError(err).Error("failed to delete status")
		return err
	}

	if res.DeletedCount == 0 {
		return fmt.Errorf("status not found")
	}

	return nil
}
func (s *StatusService) IsStatusInProject(statusID, projectID primitive.ObjectID) (bool, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := collection.CountDocuments(ctx, bson.M{
		"_id":        statusID,
		"project_id": projectID,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check status: %v", err)
	}

	return count > 0, nil
}

func (s *StatusService) GetStatusesByProjectId(projectID primitive.ObjectID) ([]*models.Status, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"project_id": projectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var statuses []*models.Status
	for cursor.Next(ctx) {
		var status models.Status
		if err := cursor.Decode(&status); err != nil {
			return nil, err
		}
		statuses = append(statuses, &status)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return statuses, nil
}
