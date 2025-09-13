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
	})
	log.SetLevel(logrus.InfoLevel)

	var user models.User

	// Body parse
	if err := c.BodyParser(&user); err != nil {
		log.WithError(err).Error("Failed to parse request body")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}
	log.Debugf("Parsed request body: %+v", user)

	// Password validation
	if user.Password == "" {
		log.Error("Password is required")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password is required",
		})
	}

	if len(user.Password) < 6 || len(user.Password) > 20 {
		log.Error("Password length invalid")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password must be between 6 and 20 characters",
		})
	}

	if CheckPasswordComplexity(user.Password) {
		log.Error("Password complexity invalid")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Password must contain at least 1 number, 1 uppercase letter, and 1 special character",
		})
	}

	log.Info("Password validation passed")

	// Email format
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)
	if !emailRegex.MatchString(user.Email) {
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
	log.Info("Full name uniqueness check passed")

	log.Info("All validations passed, proceeding to handler")
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
