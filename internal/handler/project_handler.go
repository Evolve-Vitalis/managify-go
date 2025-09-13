package handler

import (
	"managify/internal/service"
	"managify/models"

	"github.com/gofiber/fiber/v2"
)

func CreateProjectHandler(c *fiber.Ctx) error {
	var project models.Project

	if err := c.BodyParser(&project); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	res, err := service.GetProjectService().CreateProject(&project)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Invalid project",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Project created successfully",
		"project": res,
	})

}
