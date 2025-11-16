# 📊 Managify

A modern project management tool rebuilt with Go, featuring a clean architecture, RESTful API, and a beautiful React-based desktop application.


## ✨ Features

- **📋 Task Management** - Create, assign, and track tasks with status updates and priority levels
- **👥 Team Collaboration** - Manage team members, roles, and permissions across projects
- **📊 Project Tracking** - Monitor project progress with detailed dashboards and reports
- **🔒 Secure Authentication** - JWT-based authentication with secure user sessions
- **⚡ Fast Performance** - Built with Go for high performance and efficient resource usage
- **🔌 RESTful API** - Well-documented API endpoints for easy integration
- **🌙 Dark Theme** - Eye-friendly dark mode for comfortable extended use
- **💻 Desktop App** - Native desktop experience built with Electron



## 🛠️ Tech Stack

### Backend
- **Go 1.24+** - High-performance backend language
- **Fiber Framework** - Express-inspired web framework for Go
- **MongoDB** - NoSQL database for flexible data storage
- **JWT Auth** - Secure token-based authentication
- **Docker** - Containerization for easy deployment
- **Swagger** - All endpoints are fully documented

### Frontend
- **React 19** - Modern UI library
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **Ant Design** - Enterprise-class UI components
- **Electron** - Desktop application framework
- **Axios** - HTTP client for API requests

### Architecture
- **Clean Architecture** - Separation of concerns and maintainable codebase
- **REST API** - Standard HTTP methods for communication

## 📦 Installation

### Prerequisites
- Go 1.24 or higher
- Node.js 18 or higher
- MongoDB
- Docker (optional)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Evolve-Vitalis/managify-go.git
cd managify-go

# Install dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
go run main.go
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run as desktop app
npm run electron:dev
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Stop containers
docker-compose down
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
MONGO_HOST_TEST=
MONGO_USER_TEST=
MONGO_PASSWORD_TEST=
MONGO_DB_TEST=
MONGO_PORT=

SECRET_KEY=

PORT=

API_MAX_LIMITER=
RATE_LIMIT_EXPIRATION=

SMTP_FROM=
SMTP_PASSWORD=
SMTP_HOST=
SMTP_PORT=

MONGO_URI=
MONGO_DB=

SWAGGER=
METRICS=
```


## 🏗️ Project Structure

```
managify-go/
├── backend/
│   ├── internal/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── router/
│   │   └── service/
│   │   └── validation/
│   │   └── metrics/
│   ├── swagger/
│   ├── database/
│   ├── constant/
│   ├── models/
│   ├── utils/
│   ├── test/
│   ├── docs/
├── managify-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── constants/
│   │   ├── content/
│   │   └── App.jsx
│   ├── public/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Author

**Doğuhannilt**

- Email: [doguhannilt@gmail.com](mailto:doguhannilt@gmail.com)
- LinkedIn: [linkedin.com/in/doguhannilt](https://linkedin.com/in/doguhannilt)
- GitHub: [@Evolve-Vitalis](https://github.com/Evolve-Vitalis)





## Backend: Docker + MongoDB + CI

This repository includes Docker support for running the backend together with a MongoDB database, and a GitHub Actions workflow to build and push the backend Docker image to Docker Hub.

Quick start (backend only):

1. Copy `.env.example` to `.env` and fill any secrets (for local development the defaults should work):

```powershell
copy .env.example .env
```

2. Start backend + MongoDB with Docker Compose:

```powershell
docker-compose -f docker-compose.backend.yml up -d --build
```

3. The backend will be available on the port set in `.env` (default 8080).

CI / Docker Hub

- The workflow `.github/workflows/ci-docker-publish.yml` builds the Docker image and pushes it to Docker Hub on pushes to `master`.
- Add the following repository secrets in GitHub: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (a Docker Hub access token or password).

Notes

- The current application code uses MongoDB (see `database/connection.go`). The compose and CI configuration now include a MongoDB service and an image push workflow.

GitOps (recommended)
--------------------

This repository is now configured for a GitOps-first workflow. That means:

- The primary automatic pipeline is `ci-gitops-update-manifests.yml`. On every push to `master` it builds the Docker image, tags it with the commit SHA, pushes the image to Docker Hub, and updates `k8s/backend-deployment.yaml` in the repo to point to the new image tag.
- ArgoCD (recommended) watches the `k8s/` directory of this repository. When `backend-deployment.yaml` is updated by CI, ArgoCD will automatically sync the change to the cluster (deploy the new image).

Other workflows (`ci-deploy-kubectl.yml`, `ci-docker-publish.yml`) are configured as manual (`workflow_dispatch`) to avoid parallel/competing automatic deploy paths. Use them only for ad-hoc operations or debugging.

If you want, I can now:
- Replace the `REPLACE_IMAGE:REPLACE_TAG` placeholder in `k8s/backend-deployment.yaml` with your Docker Hub repo path template (e.g. `doguhanniltextra/managify-backend`) so the GitOps workflow writes the correct image value.

### GitHub Secrets (required for CI)

The CI workflow builds and pushes the Docker image to Docker Hub. Do NOT store credentials in the repository. Add these secrets to your GitHub repository settings:

- `DOCKERHUB_USERNAME` — your Docker Hub username
- `DOCKERHUB_TOKEN` — Docker Hub password or access token

To add secrets via the GitHub UI: Settings → Secrets and variables → Actions → New repository secret.

You can also add secrets using the GitHub CLI:

```powershell
gh secret set DOCKERHUB_USERNAME --body "your-username"
gh secret set DOCKERHUB_TOKEN --body "your-token"
```




