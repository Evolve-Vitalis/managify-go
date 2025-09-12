package middleware

import (
	"managify/models"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

var secretKey = []byte(os.Getenv("SECRET_KEY"))

func CreateToken(user *models.User) (string, error) {
	mapClaims := jwt.MapClaims{
		"id":    user.ID,
		"name":  user.FullName,
		"email": user.Email,
		"iss":   "user",
		"exp":   time.Now().Add(time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, mapClaims)

	logrus.Info(claims)
	logrus.Info(claims.Header)
	logrus.Info(claims.Signature)

	tokenString, err := claims.SignedString(secretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil

}
