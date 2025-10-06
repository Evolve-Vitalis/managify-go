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

func CreateProjectHandler(c *fiber.Ctx) error {
	var project models.Project

	if err := c.BodyParser(&project); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": constant.ErrBadRequest,
		})
	}

	user, ok := utils.GetUserLocal(c)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	res, err := service.GetProjectService().CreateProject(&project, user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": constant.ErrUnauthorized,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessCreated,
		"data":    res,
	})
}

func DeleteProjectHandler(c *fiber.Ctx) error {

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

type StatusWithIssues struct {
	ID        primitive.ObjectID   `json:"id"`
	ProjectID primitive.ObjectID   `json:"project_id"`
	Name      string               `json:"name"`
	CreatedAt time.Time            `json:"created_at"`
	UpdatedAt time.Time            `json:"updated_at,omitempty"`
	IssuesID  []primitive.ObjectID `bson:"issues" json:"issues_id"`
}

func GetProjectHandler(c *fiber.Ctx) error {

	projectIDHex := c.Params("id")
	projectID, err := primitive.ObjectIDFromHex(projectIDHex)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	user, ok := utils.GetUserLocal(c)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": constant.ErrInternalServer})
	}

	project, err := service.GetProjectService().GetProject(projectID, user)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": constant.ErrForbidden})
	}

	statuses, err := service.GetStatusService().GetStatusesByProjectId(projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": constant.ErrInternalServer})
	}

	_, teamMembers, err := service.GetProjectService().GetProjectWithTeam(projectID, user)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": constant.ErrForbidden})
	}

	var statusesWithIssues []StatusWithIssues
	for _, status := range statuses {
		_, err := service.GetIssueService().GetIssuesByStatusID(status.ID)
		if err != nil {
			fmt.Println(err)

		}

		statusesWithIssues = append(statusesWithIssues, StatusWithIssues{
			ID:        status.ID,
			ProjectID: status.ProjectID,
			Name:      status.Name,
			CreatedAt: status.CreatedAt,
			UpdatedAt: status.UpdatedAt,
			IssuesID:  status.IssueIDs,
		})
	}

	data := fiber.Map{
		"project":  project,
		"statutes": statusesWithIssues,
		"members":  teamMembers,
	}

	return c.JSON(fiber.Map{
		"message": constant.SuccessFetched,
		"data":    data,
	})
}

func DeleteMemberFromProjectByIdHandler(c *fiber.Ctx) error {

	memberId := c.Params("memberId")
	user, ok := utils.GetUserLocal(c)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	memberIdObj, err := primitive.ObjectIDFromHex(memberId)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": constant.ErrBadRequest})
	}

	err = service.GetProjectService().DeleteMemberFromProjectById(user.ID, memberIdObj)

	if err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": constant.ErrInternalServer,
		})
	}

	fmt.Print(err)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": constant.SuccessDeleted,
	})
}
