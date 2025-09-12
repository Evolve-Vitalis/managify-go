package middleware

import (
	"fmt"
	"managify/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func ExtractUserFromClaims(claims jwt.MapClaims) (*models.User, error) {

	idStr, ok := claims["id"].(string)
	if !ok {
		return nil, fmt.Errorf("id claim missing or invalid")
	}

	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid objectID: %v", err)
	}

	// FullName
	fullName, ok := claims["full_name"].(string)
	if !ok {
		return nil, fmt.Errorf("full_name claim missing or invalid")
	}

	// Email
	email, ok := claims["email"].(string)
	if !ok {
		return nil, fmt.Errorf("email claim missing or invalid")
	}

	user := &models.User{
		ID:       id,
		FullName: fullName,
		Email:    email,
	}

	return user, nil
}
