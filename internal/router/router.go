package router

import (
	"managify/internal/handler"
	"managify/internal/middleware"
	"managify/internal/validation"

	"github.com/gofiber/fiber/v2"
)

func Router(app *fiber.App) {
	Routers(app)

}

func Routers(app *fiber.App) {
	RouterUser(app)
	RouterAdmin(app)
}

func RouterUser(app *fiber.App) {
	api := app.Group("/users")

	api.Post("/register", validation.CreateRegisterValidator, handler.CreateRegisterHandler)
	api.Post("/auth", validation.AuthValidator, handler.LoginHandler)
}

func RouterAdmin(app *fiber.App) {
	api := app.Group("/admin")

	api.Get("/get-users", middleware.AuthMiddleware, middleware.AdminMiddleware, handler.GetUsersHandler)
}
