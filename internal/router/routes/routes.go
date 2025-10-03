package routes

const (
	version = "/v1"

	// User endpoints
	UserBase     = version + "/users"
	UserRegister = "/register"
	UserAuth     = "/auth"
	UserGetById  = "/:id"

	// Admin endpoints
	AdminBase        = version + "/admin"
	AdminGetUsers    = "/get-users"
	AdminGetUser     = "/get-user/:id"
	AdminDelete      = "/delete-user/:id"
	AdminGetProjects = "/get-projects"
	AdminGetRoles    = "/get-roles"

	// Project endpoints

	ProjectBase   = version + "/project"
	ProjectCreate = "/create-project"
	ProjectDelete = "/delete-project/:id"
	ProjectGet    = "/projects/:id"

	// Project invite endpoints

	InviteBase    = version + "/invite"
	InviteCreate  = "/project-invite"
	InviteRespond = "/project-invite/:inviteId/respond"

	// Project role endpoints

	RoleBase   = version + "/role"
	RoleCreate = "/create-role"
	RoleDelete = "/delete-role/:id/:project"

	// Project status endpoints

	StatusBase   = version + "/status"
	StatusCreate = "/create-status"
	StatusDelete = "/delete-status/:id/:project"

	// Project issue endpoints

	IssueBase   = version + "/issue"
	IssueCreate = "/create-issue"
	IssueDelete = "/delete-issue/:id"
	IssuesGet   = "/get/:statusID"
	IssueUpdate = "/update-status/:issueID/:statusID"

	// Log endpoint
	LoggerBase = version + "/logger"
	LoggerGet  = "/:projectId"
)
