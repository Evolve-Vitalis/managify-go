package handler

import (
	"managify/constant"
	"managify/dto/request"
	"managify/internal/service"
	"managify/models"
	"time"

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

	subscriptionStartDate := time.Now()
	subscriptionEndDate := time.Now()
	planType := models.PlanBasic
	isValid := true

	subscriptionMethod := models.Subscription{

		SubscriptionStartDate: subscriptionStartDate,
		SubscriptionEndDate:   subscriptionEndDate,
		PlanType:              planType,
		IsValid:               isValid,
		UserID:                user.ID,
	}
	subscription, err := service.GetSubscriptionService().CreateSubscription(&subscriptionMethod)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":      constant.SuccessCreated,
		"token":        token,
		"userEmail":    createdUser.Email,
		"subscription": subscription.PlanType,
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

func GetUserByIdHandler(c *fiber.Ctx) error {
	userIDHex := c.Params("id")

	user, err := service.GetUserService().GetUserById(userIDHex)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}
	if user == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": constant.ErrNotFound,
		})
	}

	project, err := service.GetProjectService().GetProjectsByUserId(userIDHex)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	sub, err := service.GetSubscriptionService().GetByUserId(userIDHex)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	data := fiber.Map{
		"user":         user,
		"project":      project,
		"subscription": sub,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessOperation,
		"data":    data,
	})
}
