package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Comment struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Content  string             `bson:"content" json:"content"`
	AuthorID primitive.ObjectID `bson:"author_id,omitempty" json:"-"`
	IssueID  primitive.ObjectID `bson:"issue_id,omitempty" json:"-"`
}
