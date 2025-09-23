package service

import (
	"context"

	"managify/database"
	"managify/models"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LogService struct {
	Collection string
}

var logService *LogService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetLogService() *LogService {
	if logService == nil {
		logService = &LogService{Collection: "logs"}
	}
	return logService
}

func (s *LogService) CreateLog(projectLog *models.ProjectLog) error {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	projectLog.ID = primitive.NewObjectID()

	_, err := collection.InsertOne(ctx, projectLog)
	if err != nil {
		log.Errorf("Failed to insert log")
		return err
	}

	return nil
}

func (s *LogService) GetLogsByProjectID(projectID string) ([]models.ProjectLog, error) {
	dbCollection := database.DB.Collection(s.Collection)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"project_id": projectID}

	cursor, err := dbCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []models.ProjectLog
	for cursor.Next(ctx) {
		var logEntry models.ProjectLog
		if err := cursor.Decode(&logEntry); err != nil {
			continue
		}
		logs = append(logs, logEntry)
	}

	return logs, nil
}
