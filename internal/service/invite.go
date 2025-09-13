package service

import (
	"context"
	"fmt"
	"managify/database"
	"managify/dto/request"
	"managify/models"
	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var log = logrus.New()

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func CreateProjectInvite(senderID primitive.ObjectID, req request.ProjectInviteRequest) (*models.ProjectInvite, error) {
	log.Debugf("CreateProjectInvite called with senderID=%s, req=%+v", senderID.Hex(), req)

	usersColl := database.DB.Collection("users")
	projectsColl := database.DB.Collection("projects")
	invitesColl := database.DB.Collection("project_invites")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var receiver models.User
	if err := usersColl.FindOne(ctx, bson.M{"email": req.Email}).Decode(&receiver); err != nil {
		log.WithError(err).Warnf("Receiver not found for email=%s", req.Email)
		return nil, fmt.Errorf("receiver not found")
	}
	log.Debugf("Receiver found: %+v", receiver)

	projectID, err := primitive.ObjectIDFromHex(req.ProjectID)
	if err != nil {
		log.WithError(err).Warnf("Invalid project ID: %s", req.ProjectID)
		return nil, fmt.Errorf("invalid project ID")
	}

	count, _ := projectsColl.CountDocuments(ctx, bson.M{"_id": projectID})
	if count == 0 {
		log.Warnf("Project not found with ID: %s", projectID.Hex())
		return nil, fmt.Errorf("project not found")
	}
	log.Debugf("Project exists with ID: %s", projectID.Hex())

	invite := &models.ProjectInvite{
		ProjectID:  projectID,
		SenderID:   senderID,
		ReceiverID: receiver.ID,
		Status:     "pending",
		CreatedAt:  time.Now(),
	}

	res, err := invitesColl.InsertOne(ctx, invite)
	if err != nil {
		log.WithError(err).Error("Failed to insert invite into DB")
		return nil, err
	}
	invite.ID = res.InsertedID.(primitive.ObjectID)
	log.Infof("Invite created successfully: %+v", invite)

	return invite, nil
}

func RespondProjectInvite(userID, inviteID primitive.ObjectID, accept bool) (*models.ProjectInvite, error) {
	log.Debugf("RespondProjectInvite called with userID=%s, inviteID=%s, accept=%v", userID.Hex(), inviteID.Hex(), accept)

	invitesColl := database.DB.Collection("project_invites")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	status := "declined"
	if accept {
		status = "accepted"
	}
	log.Debugf("Setting invite status to: %s", status)

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now(),
		},
	}

	res := invitesColl.FindOneAndUpdate(
		ctx,
		bson.M{"_id": inviteID, "receiver_id": userID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var invite models.ProjectInvite
	if err := res.Decode(&invite); err != nil {
		log.WithError(err).Warnf("Invite not found or already handled for inviteID=%s, userID=%s", inviteID.Hex(), userID.Hex())
		return nil, fmt.Errorf("invite not found or already handled")
	}
	log.Infof("Invite updated successfully: %+v", invite)

	if accept {
		if err := addUserToProject(invite.ProjectID, userID); err != nil {
			log.WithError(err).Errorf("Failed to add user to project: projectID=%s, userID=%s", invite.ProjectID.Hex(), userID.Hex())
			return nil, fmt.Errorf("failed to add user to project: %v", err)
		}
		log.Infof("User %s added to project %s team", userID.Hex(), invite.ProjectID.Hex())
	}

	return &invite, nil
}

func addUserToProject(projectID, userID primitive.ObjectID) error {
	log.Debugf("addUserToProject called with projectID=%s, userID=%s", projectID.Hex(), userID.Hex())
	projectsColl := database.DB.Collection("projects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$addToSet": bson.M{"team": userID},
	}

	res, err := projectsColl.UpdateOne(ctx, bson.M{"_id": projectID}, update)
	if err != nil {
		log.WithError(err).Error("Failed to update project team")
		return err
	}
	log.Debugf("addUserToProject matched %d, modified %d", res.MatchedCount, res.ModifiedCount)
	return nil
}
