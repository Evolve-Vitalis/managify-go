package handler

import (
	"managify/internal/service"

	"github.com/gofiber/fiber/v2"
)

func GetUsersHandler(c *fiber.Ctx) error {
	users, err := service.GetUserService().GetAllUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to fetch users",
			"error":   err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"message": "Success",
		"data":    users,
	})
}
