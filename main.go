package main

import (
	"managify/database"
	"managify/internal/middleware"
	"managify/internal/router"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	middleware.InitLogger()
	err := godotenv.Load()
	if err != nil {
		logrus.Fatal("Error loading .env file")
	}

	if err := database.Connect(); err != nil {
		logrus.Infoln("Database connection failed: ", err)
	}

	app := fiber.New()
	router.Routers(app)
	app.Listen(os.Getenv("PORT"))

}
