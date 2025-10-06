package handler

import (
	"fmt"
	"managify/constant"
	"managify/internal/service"
	"managify/models"
	"managify/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetIssuesByStatusHandler(c *fiber.Ctx) error {
	statusIDHex := c.Params("statusID")
	statusID, err := primitive.ObjectIDFromHex(statusIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	issues, err := service.GetIssueService().GetIssuesByStatusID(statusID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": constant.ErrInternalServer})
	}

	data := make([]fiber.Map, 0, len(issues))
	for _, i := range issues {
		data = append(data, fiber.Map{
			"id":          i.ID,
			"title":       i.Title,
			"description": i.Description,
			"priority":    i.Priority,
			"due_date":    i.DueDate,
			"status_id":   i.StatusID,
			"project_id":  i.ProjectID,
		})
	}

	return c.JSON(fiber.Map{
		"message": constant.SuccessFetched,
		"data":    data,
	})
}
func CreateIssueHandler(c *fiber.Ctx) error {
	fmt.Println("🚀 [CreateIssueHandler] Initialized at:", time.Now().Format(time.RFC3339))
	fmt.Println("=====================================================")

	var issue models.Issue

	// Parse request body
	if err := c.BodyParser(&issue); err != nil {
		fmt.Println("❌ [BodyParser] Error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	// Get user
	user, ok := utils.GetUserLocal(c)
	if !ok {
		fmt.Println("❌ [UserLocal] Could not get user")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}
	fmt.Printf("👤 [UserLocal] UserID: %v\n", user.ID.Hex())

	fmt.Println("🧠 [ServiceCall] Creating issue...")
	res, err := service.GetIssueService().CreateIssue(&issue, user.ID)
	if err != nil {
		fmt.Println("❌ [ServiceError]", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessCreated,
		"data":    res,
	})
}

func DeleteIssueHandler(c *fiber.Ctx) error {
	user, ok := utils.GetUserLocal(c)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	idStr := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	err = service.GetIssueService().DeleteIssue(objID, user.ID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessDeleted,
	})
}

func UpdateIssueStatusHandler(c *fiber.Ctx) error {

	user, ok := utils.GetUserLocal(c)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	issueIDHex := c.Params("issueID")
	newStatusIDHex := c.Params("statusID")

	issueID, err := primitive.ObjectIDFromHex(issueIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	newStatusID, err := primitive.ObjectIDFromHex(newStatusIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	updatedIssue, err := service.GetIssueService().UpdateIssueStatus(issueID, newStatusID, user.ID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessUpdated,
		"data": fiber.Map{
			"id":          updatedIssue.ID,
			"title":       updatedIssue.Title,
			"description": updatedIssue.Description,
			"priority":    updatedIssue.Priority,
			"due_date":    updatedIssue.DueDate,
			"status_id":   updatedIssue.StatusID.Hex(),
			"project_id":  updatedIssue.ProjectID,
		},
	})
}
