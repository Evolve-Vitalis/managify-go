package routes

const (
	// User endpoints
	UserBase     = "/users"
	UserRegister = "/register"
	UserAuth     = "/auth"

	// Admin endpoints
	AdminBase     = "/admin"
	AdminGetUsers = "/get-users"
	AdminGetUser  = "/get-user/:id"
	AdminDelete   = "/delete-user/:id"

	// Project endpoints

	ProjectBase   = "/project"
	ProjectCreate = "/create-project"
)
