package validation

import (
	"context"
	"managify/database"
	"managify/internal/service"
	"managify/models"
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"

	"go.mongodb.org/mongo-driver/bson"
)

func CreateRegisterValidator(c *fiber.Ctx) error {
	us := service.GetUserService()
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.InfoLevel)

	var user models.User

	// Body parse
	if err := c.BodyParser(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Password validation
	if user.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password is required",
		})
	}

	if len(user.Password) < 6 || len(user.Password) > 20 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password must be between 6 and 20 characters",
		})
	}

	if CheckPasswordComplexity(user.Password) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password must contain at least 1 number, 1 uppercase letter, and 1 special character",
		})
	}

	// Email format
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)
	if !emailRegex.MatchString(user.Email) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid email format",
		})
	}

	// DB uniqueness checks
	collection := database.DB.Collection(us.Collection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	emailCount, err := collection.CountDocuments(ctx, bson.M{"email": user.Email})
	if err != nil {
		log.WithError(err).Error("Failed to count email in DB")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Internal Server Error",
			"error":   err,
		})
	}
	if emailCount > 0 {
		log.Warnf("Email already exists: %s", user.Email)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Email already exists",
		})
	}
	log.Info("Email uniqueness check passed")

	fullNameCount, err := collection.CountDocuments(ctx, bson.M{"full_name": user.FullName})
	if err != nil {
		log.WithError(err).Error("Failed to count full name in DB")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Internal Server Error",
			"error":   err,
		})
	}
	if fullNameCount > 0 {
		log.Warnf("Full name already exists: %s", user.FullName)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Name already exists",
		})
	}

	return c.Next()
}

func CheckPasswordComplexity(password string) bool {
	hasNumber := false
	hasUpper := false
	hasSpecial := false

	for _, c := range password {
		switch {
		case c >= '0' && c <= '9':
			hasNumber = true
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case (c >= '!' && c <= '/') ||
			(c >= ':' && c <= '@') ||
			(c >= '[' && c <= '`') ||
			(c >= '{' && c <= '~'):
			hasSpecial = true
		}
	}

	return hasNumber && hasUpper && hasSpecial
}
