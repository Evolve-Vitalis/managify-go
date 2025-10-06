package service

import (
	"context"
	"time"

	"managify/database"
	"managify/models"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SubscriptionService struct {
	Collection string
}

var subscriptionService *SubscriptionService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetSubscriptionService() *SubscriptionService {
	if subscriptionService == nil {
		subscriptionService = &SubscriptionService{Collection: "subscriptions"}
	}
	return subscriptionService
}

func (s *SubscriptionService) GetByUserId(userIDHex string) (*models.Subscription, error) {
	userObjID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := database.DB.Collection(s.Collection)
	var subscription models.Subscription

	err = collection.FindOne(ctx, bson.M{"user_id": userObjID}).Decode(&subscription)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &subscription, nil
}

func (s *SubscriptionService) CreateSubscription(subscription *models.Subscription) (*models.Subscription, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := database.DB.Collection(s.Collection)

	if subscription.ID.IsZero() {
		subscription.ID = primitive.NewObjectID()
	}

	_, err := collection.InsertOne(ctx, subscription)
	if err != nil {
		return nil, err
	}

	return subscription, nil
}
