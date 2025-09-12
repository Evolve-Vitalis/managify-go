package main

import (
	"managify/database"
	"managify/internal/middleware"

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

}
