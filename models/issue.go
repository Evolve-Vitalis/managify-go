package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Issue struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title       string               `bson:"title" json:"title"`
	Description string               `bson:"description" json:"description"`
	Status      string               `bson:"status" json:"status"`
	ProjectID   primitive.ObjectID   `bson:"project_id,omitempty" json:"project_id"`
	Priority    string               `bson:"priority" json:"priority"`
	DueDate     string               `bson:"due_date,omitempty" json:"due_date"`
	Tags        []string             `bson:"tags,omitempty" json:"tags"`
	AssignedID  primitive.ObjectID   `bson:"assigned_id,omitempty" json:"-"`
	CommentIDs  []primitive.ObjectID `bson:"comments,omitempty" json:"-"`
}
