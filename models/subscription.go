package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type PlanType string

const (
	PlanBasic   PlanType = "BASIC"
	PlanPremium PlanType = "PREMIUM"
	PlanPro     PlanType = "PRO"
)

type Subscription struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SubscriptionStartDate string             `bson:"subscription_start_date" json:"subscription_start_date"`
	SubscriptionEndDate   string             `bson:"subscription_end_date" json:"subscription_end_date"`
	PlanType              PlanType           `bson:"plan_type" json:"plan_type"`
	IsValid               bool               `bson:"is_valid" json:"is_valid"`
	UserID                primitive.ObjectID `bson:"user_id,omitempty" json:"-"` // User reference
}
