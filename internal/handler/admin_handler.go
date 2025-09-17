package handler

import (
	"managify/constant"
	"managify/internal/service"

	"github.com/gofiber/fiber/v2"
)

func GetUsersHandler(c *fiber.Ctx) error {
	users, err := service.GetUserService().GetAllUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
			"error":   err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"message": constant.SuccessCreated,
		"data":    users,
	})
}

func GetUserById(c *fiber.Ctx) error {
	id := c.Params("id")

	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrNotFound,
		})
	}

	user, err := service.GetUserService().GetUserById(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessOperation,
		"user":    user,
	})
}

func DeleteUserById(c *fiber.Ctx) error {
	id := c.Params("id")

	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}
	res, err := service.GetUserService().DeleteUserById(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessUpdated,
		"user":    res,
	})
}

func GetProjectsHandler(c *fiber.Ctx) error {
	projects, err := service.GetProjectService().GetAllProjects()

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"message": constant.SuccessOperation,
		"data":    projects,
	})
}
