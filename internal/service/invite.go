package service

import (
	"context"
	"fmt"
	"managify/database"
	"managify/dto/request"
	"managify/models"
	"sync"
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
	usersColl := database.DB.Collection("users")
	projectsColl := database.DB.Collection("projects")
	invitesColl := database.DB.Collection("project_invites")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		wg       sync.WaitGroup
		receiver models.User
		project  models.Project
	)

	errChan := make(chan error, 2)

	wg.Add(2)

	go func() {
		defer wg.Done()
		usersCollFilter := bson.M{"email": req.Email}
		if err := usersColl.FindOne(ctx, usersCollFilter).Decode(&receiver); err != nil {
			errChan <- fmt.Errorf("receiver not found")
			return
		}
	}()

	go func() {
		defer wg.Done()
		projectID, err := primitive.ObjectIDFromHex(req.ProjectID)
		if err != nil {
			errChan <- fmt.Errorf("invalid project ID")
			return
		}

		projectsCollFilter := bson.M{"_id": projectID}
		if err := projectsColl.FindOne(ctx, projectsCollFilter).Decode(&project); err != nil {
			errChan <- fmt.Errorf("project not found")
			return
		}
	}()

	wg.Wait()
	close(errChan)

	for err := range errChan {
		if err != nil {
			return nil, err
		}
	}

	projectID, _ := primitive.ObjectIDFromHex(req.ProjectID)

	for _, member := range project.TeamIDs {
		if member == receiver.ID {
			return nil, fmt.Errorf("user is already a member of this project")
		}
	}

	statusFilter := bson.M{"$in": []string{"pending", "accepted"}}
	filter := bson.M{
		"receiver_id": receiver.ID,
		"project_id":  projectID,
		"status":      statusFilter,
	}

	count, err := invitesColl.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, fmt.Errorf("invite already sent to this user")
	}

	update := bson.M{
		"$setOnInsert": bson.M{
			"project_id":  projectID,
			"receiver_id": receiver.ID,
			"sender_id":   senderID,
			"status":      "pending",
			"created_at":  time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	res := invitesColl.FindOneAndUpdate(ctx, filter, update, opts)

	var invite models.ProjectInvite
	if err := res.Decode(&invite); err != nil {
		return nil, fmt.Errorf("invite already exists or could not be created")
	}

	projectLogId := primitive.NewObjectID()
	projectLog := models.ProjectLog{
		ID:        projectLogId,
		ProjectID: projectID.Hex(),
		UserID:    senderID.Hex(),
		Message:   "Invite has been sent to " + req.Email,
		Timestamp: time.Now(),
	}

	if err := GetLogService().CreateLog(&projectLog); err != nil {
		return nil, err
	}

	return &invite, nil
}

type ProjectInviteFull struct {
	ID        primitive.ObjectID `json:"id"`
	Status    string             `json:"status"`
	CreatedAt time.Time          `json:"createdAt"`
	Project   models.Project     `json:"project"`
	Sender    models.User        `json:"sender"`
	Receiver  models.User        `json:"receiver"`
}

func GetProjectInvites(receiverID primitive.ObjectID) ([]*ProjectInviteFull, error) {
	invitesColl := database.DB.Collection("project_invites")
	usersColl := database.DB.Collection("users")
	projectsColl := database.DB.Collection("projects")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := invitesColl.Find(ctx, bson.M{"receiver_id": receiverID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var result []*ProjectInviteFull

	for cursor.Next(ctx) {
		var invite models.ProjectInvite
		if err := cursor.Decode(&invite); err != nil {
			return nil, err
		}

		// Project decode
		var project models.Project
		if err := projectsColl.FindOne(ctx, bson.M{"_id": invite.ProjectID}).Decode(&project); err != nil {
			project = models.Project{Name: "Project"} // fallback
		}

		// Sender decode
		var sender models.User
		if err := usersColl.FindOne(ctx, bson.M{"_id": invite.SenderID}).Decode(&sender); err != nil {
			sender = models.User{FullName: "Someone"} // fallback
		}

		// Receiver decode (opsiyonel, genelde zaten senin receiverID var)
		var receiver models.User
		if err := usersColl.FindOne(ctx, bson.M{"_id": invite.ReceiverID}).Decode(&receiver); err != nil {
			receiver = models.User{FullName: "Unknown"}
		}

		result = append(result, &ProjectInviteFull{
			ID:        invite.ID,
			Status:    invite.Status,
			CreatedAt: invite.CreatedAt,
			Project:   project,
			Sender:    sender,
			Receiver:  receiver,
		})
	}

	return result, nil
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
		projectLogId := primitive.NewObjectID()
		projectLog := models.ProjectLog{
			ID:        projectLogId,
			ProjectID: invite.ProjectID.Hex(),
			UserID:    userID.Hex(),
			Message:   "Invite has been accepted",
			Timestamp: time.Now(),
		}
		if err := GetLogService().CreateLog(&projectLog); err != nil {
			return nil, err
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
