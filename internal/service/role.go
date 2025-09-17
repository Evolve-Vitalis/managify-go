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

type RoleService struct {
	Collection string
}

var roleService *RoleService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetRoleService() *RoleService {
	if roleService == nil {
		roleService = &RoleService{Collection: "roles"}
	}
	return roleService
}

func (s *RoleService) AddRole(userId primitive.ObjectID, projectId primitive.ObjectID, roleName string) (*models.Role, error) {

	ps := GetProjectService()

	projectValid, err := ps.IsProjectValid(projectId)
	if err != nil || !projectValid {
		return nil, err
	}

	role := &models.Role{
		ID:        primitive.NewObjectID(),
		UserID:    userId,
		ProjectID: projectId,
		RoleName:  roleName,
	}

	exists, err := ps.IsUserInProject(role.UserID, role.ProjectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user is not part of the project")
	}

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, role)
	if err != nil {
		log.WithError(err).Error("failed to insert role")
		return nil, err
	}

	return role, nil
}

func (s *RoleService) DeleteRole(deleteId primitive.ObjectID) error {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := collection.DeleteOne(ctx, bson.M{"_id": deleteId})
	if err != nil {
		log.WithError(err).Error("failed to delete role")
		return err
	}

	if res.DeletedCount == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}
