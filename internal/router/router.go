package router

import (
	"managify/internal/handler"
	"managify/internal/validation"

	"github.com/gofiber/fiber/v2"
)

func Router(app *fiber.App) {

	Routers(app)

}

func Routers(app *fiber.App) {
	RouterUser(app)
}

func RouterUser(app *fiber.App) {
	api := app.Group("/users")

	api.Post("/register", validation.CreateRegisterValidator, handler.CreateRegisterHandler)
	api.Post("/auth", validation.AuthValidator, handler.LoginHandler)
}
