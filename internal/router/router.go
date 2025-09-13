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
	api := app.Group(routes.AdminBase)

	api.Get(routes.AdminGetUsers, middleware.AuthMiddleware, middleware.AdminMiddleware, handler.GetUsersHandler)
	api.Get(routes.AdminGetUser, middleware.AuthMiddleware, middleware.AdminMiddleware, handler.GetUserById)
	api.Delete(routes.AdminDelete, middleware.AuthMiddleware, middleware.AdminMiddleware, handler.DeleteUserById)
}

func RouterProject(app *fiber.App) {
	api := app.Group(routes.ProjectBase)

	api.Post(routes.ProjectCreate, middleware.AuthMiddleware, handler.CreateProjectHandler)
}
