package middleware

import (
	"fmt"
	"managify/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func ExtractUserFromClaims(claims jwt.MapClaims) (*models.User, error) {
	// ID
	idStr, ok := claims["id"].(string)
	if !ok {
		return nil, fmt.Errorf("id claim missing or invalid")
	}
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid objectID: %v", err)
	}

	// FullName
	fullName, ok := claims["name"].(string)
	if !ok {
		return nil, fmt.Errorf("name claim missing or invalid")
	}

	// Email
	email, ok := claims["email"].(string)
	if !ok {
		return nil, fmt.Errorf("email claim missing or invalid")
	}

	// IsAdmin
	isAdmin, ok := claims["is_admin"].(bool)
	if !ok {
		// Eğer claim yoksa varsayılan false
		isAdmin = false
	}

	user := &models.User{
		ID:       id,
		FullName: fullName,
		Email:    email,
		IsAdmin:  isAdmin,
	}

	return user, nil
}
