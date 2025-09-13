package validation

import (
	"context"
	"managify/database"
	"managify/dto/request"
	"managify/internal/service"
	"managify/models"
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
)

func AuthValidator(c *fiber.Ctx) error {
	us := service.GetUserService()
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.InfoLevel)

	var req request.UserLoginRequest

	if err := c.BodyParser(&req); err != nil {
		log.WithError(err).Error("Failed to parse request body")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	log.Debugf("Parsed request body: %+v", req)

	if req.Password == "" {
		log.Error("Password is required")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password is required",
		})
	}

	log.Info("Password validation passed")
	// Email format
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		log.Error("Email format invalid")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid email format",
		})
	}
	log.Info("Email format validation passed")

	// DB uniqueness checks
	collection := database.DB.Collection(us.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		log.Warnf("User not found: %s", req.Email)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Invalid email or password",
		})
	}

	return c.Next()
}
