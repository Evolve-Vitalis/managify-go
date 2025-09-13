package service

import (
	"context"
	"fmt"
	"managify/database"
	"managify/dto/request"
	"managify/dto/response"
	"managify/internal/middleware"

	"managify/models"

	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	Collection string
}

var userService *UserService

func GetUserService() *UserService {
	if userService == nil {
		userService = &UserService{Collection: "users"}
	}
	return userService
}

func (s *UserService) CreateUser(user *models.User) (*models.User, string, error) {
	var log = logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.Infof("Attempting to create user: %s", user.Email)

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hashedPassword, err := encryptPassword([]byte(user.Password))
	if err != nil {
		log.Errorf("Password encryption failed: %v", err)
		return nil, "", err
	}
	user.Password = string(hashedPassword)
	user.ID = primitive.NewObjectID()

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		log.Errorf("Failed to insert user into DB: %v", err)
		return nil, "", err
	}

	tokenString, err := middleware.CreateToken(user)
	if err != nil {
		log.Errorf("Failed to create JWT token: %v", err)
		return nil, "", err
	}

	user.Password = ""
	log.Infof("User created successfully: %s", user.Email)

	return user, tokenString, nil
}

func (s *UserService) Login(req *request.UserLoginRequest) (*response.UserLoginResponse, error) {
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.Infof("Attempting login for email: %s", req.Email)

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		log.Warnf("User not found: %s", req.Email)
		return nil, fmt.Errorf("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		log.Warnf("Invalid password for email: %s", req.Email)
		return nil, fmt.Errorf("invalid email or password")
	}

	tokenString, err := middleware.CreateToken(&user)
	if err != nil {
		log.Errorf("Failed to create JWT token for user: %s, error: %v", req.Email, err)
		return nil, fmt.Errorf("could not generate token")
	}

	resp := &response.UserLoginResponse{
		FullName: user.FullName,
		Email:    user.Email,
		Token:    tokenString,
	}

	log.Infof("User logged in successfully: %s", req.Email)
	return resp, nil
}

func encryptPassword(givenPassword []byte) (password []byte, error error) {
	hashedPassword, err := bcrypt.GenerateFromPassword(givenPassword, bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return hashedPassword, nil
}
