package routes

const (
	version = "/v1"

	// User endpoints
	UserBase     = version + "/users"
	UserRegister = version + "/register"
	UserAuth     = version + "/auth"

	// Admin endpoints
	AdminBase        = version + "/admin"
	AdminGetUsers    = "/get-users"
	AdminGetUser     = "/get-user/:id"
	AdminDelete      = "/delete-user/:id"
	AdminGetProjects = "/get-projects"

	// Project endpoints

	ProjectBase   = version + "/project"
	ProjectCreate = "/create-project"
	ProjectDelete = "/delete-project/:id"
	ProjectGet    = "/projects/:id"

	// Project invite endpoints

	InviteBase    = version + "/invite"
	InviteCreate  = "/project-invite"
	InviteRespond = "/project-invite/:inviteId/respond"
)
