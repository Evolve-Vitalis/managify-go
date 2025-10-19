package main

import (
	"managify/constant"
	"managify/database"
	"managify/internal/middleware"
	"managify/internal/router"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2/middleware/pprof"

	_ "managify/internal/handler"
	_ "managify/swagger"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/joho/godotenv"

	"github.com/sirupsen/logrus"
)

// @Title Managify API
// @Version 1.0
// @Description This is the API documentation for the Managify project management application. It provides endpoints for managing projects, issues, users, roles, statuses, and project invites.
// @Host localhost:3000
// @Contact.name Doguhan İlter
// @Contact.email doguhannilt@gmail.com
// @BasePath /
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
	host := os.Getenv("VUE_HOST")
	allowMethods := "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS"
	app.Use(cors.New(cors.Config{
		AllowOrigins:     host,
		AllowMethods:     allowMethods,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	apiLimiter(app)

	app.Use(middleware.MetricMiddleware)

	// pprof for performance monitoring
	app.Use(pprof.New())
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
