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

func GetUserById(c *fiber.Ctx) error {
	id := c.Params("id")

	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Failed to fetch id",
		})
	}

	user, err := service.GetUserService().GetUserById(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Status internal server error",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Success",
		"user":    user,
	})
}

func DeleteUserById(c *fiber.Ctx) error {
	id := c.Params("id")

	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Failed to fetch id",
		})
	}
	res, err := service.GetUserService().DeleteUserById(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Status internal server error",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Success",
		"user":    res,
	})
}
