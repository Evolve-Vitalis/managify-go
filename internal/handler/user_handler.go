package handler

import (
	"managify/constant"
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
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}

	createdUser, token, err := service.GetUserService().CreateUser(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":   constant.SuccessCreated,
		"token":     token,
		"userEmail": createdUser.Email,
	})
}
func LoginHandler(c *fiber.Ctx) error {
	var req request.UserLoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}

	res, err := service.GetUserService().Login(&req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessOperation,
		"email":   res.Email,
		"name":    res.FullName,
		"token":   res.Token,
	})
}
