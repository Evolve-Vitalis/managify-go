package handler

import (
	"managify/dto/request"
	"managify/internal/service"
	"managify/models"

	"github.com/gofiber/fiber/v2"
)

func CreateRegisterHandler(c *fiber.Ctx) error {
	var user models.User

	// Body parse
	if err := c.BodyParser(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	createdUser, token, err := service.GetUserService().CreateUser(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Could not create user",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":   "Created",
		"token":     token,
		"userEmail": createdUser.Email,
	})
}
func LoginHandler(c *fiber.Ctx) error {
	var req request.UserLoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	res, err := service.GetUserService().Login(&req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Invalid email or password",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Login successful",
		"email":   res.Email,
		"name":    res.FullName,
		"token":   res.Token,
	})
}
