package handler

import (
	"managify/constant"
	"managify/dto/request"
	"managify/internal/service"
	"managify/models"

	"github.com/gofiber/fiber/v2"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateProjectInviteHandler(c *fiber.Ctx) error {
	var req request.ProjectInviteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
			"error":   err.Error(),
		})
	}

	userVal := c.Locals("user")
	sender, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	invite, err := service.CreateProjectInvite(sender.ID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	return c.JSON(fiber.Map{
		"message": constant.SuccessCreated,
		"invite":  invite,
	})
}

func RespondProjectInviteHandler(c *fiber.Ctx) error {
	inviteIDHex := c.Params("inviteId")
	inviteID, err := primitive.ObjectIDFromHex(inviteIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	userVal := c.Locals("user")
	user, ok := userVal.(*models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": constant.ErrUnauthorized})
	}

	action := c.Query("action")
	accept := false
	if action == "accept" {
		accept = true
	} else if action != "decline" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	invite, err := service.RespondProjectInvite(user.ID, inviteID, accept)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	return c.JSON(fiber.Map{
		"message": constant.SuccessUpdated,
		"invite":  invite,
	})
}
