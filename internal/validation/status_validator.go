package validation

import (
	"managify/models"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func CreateStatusValidator(c *fiber.Ctx) error {
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
		ForceColors:   true,
	})
	log.SetLevel(logrus.InfoLevel)

	var status models.Status

	// Body parse
	if err := c.BodyParser(&status); err != nil {
		log.WithError(err).Error("Failed to parse request body")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	log.Debugf("Parsed request body: %+v", status)

	// Name validation
	if status.Name == "" {
		log.Error("Status name is required")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Status name is required",
		})
	}
	if len(status.Name) > 100 {
		log.Error("Status name too long")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Status name must be at most 100 characters",
		})
	}

	log.Info("Status validation passed")
	return c.Next()
}
