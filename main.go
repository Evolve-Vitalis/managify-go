package main

import (
	"managify/constant"
	"managify/database"
	"managify/internal/middleware"
	"managify/internal/router"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
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

	apiLimiter(app)

	router.Routers(app)
	app.Listen(os.Getenv("PORT"))

}

func apiLimiter(app *fiber.App) {

	apiMaxLimiter, _ := strconv.Atoi(os.Getenv("API_MAX_LIMITER"))
	expirationSec, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_EXPIRATION"))

	app.Use(limiter.New(limiter.Config{
		Max:        apiMaxLimiter,
		Expiration: time.Duration(expirationSec) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": constant.ErrTooManyRequests,
			})
		},
	}))
}
