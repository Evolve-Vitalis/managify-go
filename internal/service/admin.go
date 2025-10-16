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

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func (s *UserService) GetAllUsers() ([]models.User, error) {

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Find().SetLimit(100).SetProjection(bson.M{"password": 0})

	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		log.WithError(err).Error("Failed to find users")
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		log.WithError(err).Error("Failed to decode users from cursor")
		return nil, err
	}

	if err := cursor.Err(); err != nil {
		log.WithError(err).Error("Cursor error after fetching users")
		return nil, err
	}

	log.Infof("GetAllUsers succeeded, retrieved %d users", len(users))
	return users, nil
}

func (s *UserService) GetUserById(id string) (*models.User, error) {

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		log.WithError(err).Warnf("Invalid ObjectID format: %s", id)
		return nil, fmt.Errorf("invalid id: %v", err)
	}

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	optsFilter := bson.M{"password": 0}
	opts := options.FindOne().SetProjection(optsFilter)

	var user models.User
	filter := bson.M{"_id": objID}
	err = collection.FindOne(ctx, filter, opts).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (s *UserService) DeleteUserById(id string) (*mongo.DeleteResult, error) {

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid ObjectID format: %v", err)
	}

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": objID}
	res, err := collection.DeleteOne(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to delete user: %v", err)
	}

	if res.DeletedCount == 0 {
		return res, fmt.Errorf("user not found")
	}

	return res, nil
}

func (s *ProjectService) GetAllProjects() ([]models.Project, error) {
	log.Debug("GetAllProjects called")

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		log.WithError(err).Error("Failed to find projects")
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []models.Project
	if err := cursor.All(ctx, &projects); err != nil {
		log.WithError(err).Error("Failed to decode projects from cursor")
		return nil, err
	}

	if err := cursor.Err(); err != nil {
		log.WithError(err).Error("Cursor error after fetching projects")
		return nil, err
	}

	return projects, nil
}

func (s *RoleService) GetAllRoles() ([]models.Role, error) {
	log.Debug("GetAllRoles called")

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		log.WithError(err).Error("Failed to find roles")
		return nil, err
	}
	defer cursor.Close(ctx)

	var roles []models.Role
	if err := cursor.All(ctx, &roles); err != nil {
		log.WithError(err).Error("Failed to decode projects from cursor")
		return nil, err
	}
	if err := cursor.Err(); err != nil {
		log.WithError(err).Error("Cursor error after fetching projects")
		return nil, err
	}

	log.Infof("GetAllRoles succeeded, retrieved %d roles", len(roles))
	return roles, nil
}
