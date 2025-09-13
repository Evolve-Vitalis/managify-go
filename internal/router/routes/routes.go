package routes

const (
	// User endpoints
	UserBase     = "/users"
	UserRegister = "/register"
	UserAuth     = "/auth"

	// Admin endpoints
	AdminBase        = "/admin"
	AdminGetUsers    = "/get-users"
	AdminGetUser     = "/get-user/:id"
	AdminDelete      = "/delete-user/:id"
	AdminGetProjects = "/get-projects"

	// Project endpoints

	ProjectBase   = "/project"
	ProjectCreate = "/create-project"
	ProjectDelete = "/delete-project/:id"

	// Project invite endpoints

	InviteBase    = "/invite"
	InviteCreate  = "/project-invite"
	InviteRespond = "/project-invite/:inviteId/respond"
)
