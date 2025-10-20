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



