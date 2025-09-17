package handler

import (
	"managify/constant"
	"managify/internal/service"
	"managify/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateProjectHandler(c *fiber.Ctx) error {
	var project models.Project

	if err := c.BodyParser(&project); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}

	userVal := c.Locals("user")
	user, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	res, err := service.GetProjectService().CreateProject(&project, user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessCreated,
		"project": res,
	})

}

func DeleteProjectHandler(c *fiber.Ctx) error {
	userVal := c.Locals("user")
	user, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	idStr := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}

	err = service.GetProjectService().DeleteProjectById(objID, user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessDeleted,
	})
}

func GetProjectHandler(c *fiber.Ctx) error {
	projectIDHex := c.Params("id")
	projectID, err := primitive.ObjectIDFromHex(projectIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	userVal := c.Locals("user")
	user, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": constant.ErrUnauthorized})
	}

	project, err := service.GetProjectService().GetProject(projectID, user)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": constant.ErrForbidden})
	}

	return c.JSON(fiber.Map{
		"message": constant.SuccessFetched,
		"project": project,
	})
}
