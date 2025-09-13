package middleware

import (
	"managify/models"

	"github.com/gofiber/fiber/v2"
)

// AdminMiddleware ensures only admins can access the route
func AdminMiddleware(c *fiber.Ctx) error {
	userVal := c.Locals("user")
	if userVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized",
		})
	}

	user, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "User type assertion failed",
		})
	}

	if !user.IsAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "You are not allowed to access this resource",
		})
	}

	return c.Next()
}
