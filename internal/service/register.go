package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"managify/database"
	"managify/dto/request"
	"managify/dto/response"
	"managify/internal/middleware"
	"net/smtp"
	"os"

	"managify/models"

	"time"

	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	Collection      string
	EncryptPassword func([]byte) ([]byte, error)
	CreateToken     func(*models.User) (string, error)
}

var userService *UserService

func init() {
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.DebugLevel)
}

func GetUserService() *UserService {
	if userService == nil {
		userService = &UserService{Collection: "users"}
		userService.CreateToken = middleware.CreateToken
		userService.EncryptPassword = encryptPassword
	}
	return userService
}

func generateToken(n int) (string, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// E-posta gönderici (örnek, SMTP ayarlarını kendine göre düzenle)
func sendVerificationEmail(email, token string) error {

	from := os.Getenv("SMTP_FROM")
	pass := os.Getenv("SMTP_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	fmt.Println(from, pass, smtpHost, smtpPort)

	to := email
	msg := "Subject: Email Verification\n" +
		"MIME-version: 1.0;\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\n\n" +
		"<html>" +
		"<body>" +
		"<h2>Verify Your Email</h2>" +
		"<p>Click the button below to verify your account:</p>" +
		"<a href='http://localhost:5173/verify?token=" + token + "' " +
		"style='display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;'>Verify Email</a>" +
		"<p>If you did not create an account, you can ignore this email.</p>" +
		"</body>" +
		"</html>"

	fmt.Println(msg)

	addr := smtpHost + ":" + smtpPort
	return smtp.SendMail(addr,
		smtp.PlainAuth("", from, pass, smtpHost),
		from, []string{to}, []byte(msg))
}

func (s *UserService) CreateUser(user *models.User) (*models.User, string, error) {
	log.Infof("Attempting to create user: %s", user.Email)

	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hashedPassword, err := s.EncryptPassword([]byte(user.Password))
	if err != nil {
		log.Errorf("Password encryption failed: %v", err)
		return nil, "", err
	}
	user.Password = string(hashedPassword)
	user.ID = primitive.NewObjectID()

	verifyToken, err := generateToken(32)
	if err != nil {
		return nil, "", err
	}
	user.VerificationToken = verifyToken
	user.IsVerified = false

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		log.Errorf("Failed to insert user into DB: %v", err)
		return nil, "", err
	}

	tokenString, err := s.CreateToken(user)
	if err != nil {
		log.Errorf("Failed to create JWT token: %v", err)
		return nil, "", err
	}

	go sendVerificationEmail(user.Email, user.VerificationToken)

	user.Password = ""

	return user, tokenString, nil
}

func (s *UserService) VerifyEmail(token string) (*models.User, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"verificationtoken": token}).Decode(&user)
	if err != nil {
		fmt.Println("Error finding user with token:", err)
		return nil, err
	}

	update := bson.M{"$set": bson.M{"isverified": true, "verificationtoken": ""}}
	_, err = collection.UpdateOne(ctx, bson.M{"_id": user.ID}, update)
	if err != nil {
		return nil, err
	}
	user.IsVerified = true
	user.VerificationToken = ""

	return &user, nil
}

func (s *UserService) Login(req *request.UserLoginRequest) (*response.UserLoginResponse, error) {
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

	tokenString, err := s.CreateToken(&user)
	if err != nil {
		log.Errorf("Failed to create JWT token for user: %s, error: %v", req.Email, err)
		return nil, fmt.Errorf("could not generate token")
	}

	resp := &response.UserLoginResponse{
		FullName: user.FullName,
		Email:    user.Email,
		Token:    tokenString,
	}
	if user.IsVerified == false {
		go sendVerificationEmail(user.Email, user.VerificationToken)
	}

	log.Infof("User logged in successfully: %s", req.Email)
	return resp, nil
}

func (s *UserService) IsUserValid(userId primitive.ObjectID) (bool, error) {

	fmt.Printf("user Id in IsUserValid %v", userId)
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var user models.User

	err := collection.FindOne(ctx, bson.M{
		"_id": userId,
	}).Decode(&user)

	if err != nil {
		log.WithError(err).Error("failed to fetch user")
		return false, err
	}
	return true, nil
}

func encryptPassword(givenPassword []byte) (password []byte, error error) {
	hashedPassword, err := bcrypt.GenerateFromPassword(givenPassword, bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return hashedPassword, nil
}

func (s *UserService) GetUserByGivenId(givenId string) (*models.User, error) {
	collection := database.DB.Collection(s.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(givenId)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}
