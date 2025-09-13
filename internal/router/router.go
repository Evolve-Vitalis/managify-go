package router

import (
	"managify/internal/handler"
	"managify/internal/middleware"
	"managify/internal/router/routes"

	"managify/internal/validation"

	"github.com/gofiber/fiber/v2"
)

func Routers(app *fiber.App) {
	RouterUser(app)
	RouterAdmin(app)
	RouterProject(app)
}

func RouterUser(app *fiber.App) {
	api := app.Group(routes.UserBase)

	api.Post(routes.UserRegister, validation.CreateRegisterValidator, handler.CreateRegisterHandler)
	api.Post(routes.UserAuth, validation.AuthValidator, handler.LoginHandler)
}

func RouterAdmin(app *fiber.App) {
	api := app.Group(routes.AdminBase, middleware.AuthMiddleware, middleware.AdminMiddleware)

	api.Get(routes.AdminGetUsers, handler.GetUsersHandler)
	api.Get(routes.AdminGetUser, handler.GetUserById)
	api.Delete(routes.AdminDelete, handler.DeleteUserById)
}

func RouterProject(app *fiber.App) {
	api := app.Group(routes.ProjectBase, middleware.AuthMiddleware)

	api.Post(routes.ProjectCreate, handler.CreateProjectHandler)
	api.Delete(routes.ProjectDelete, handler.DeleteProjectHandler)
}
