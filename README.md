# homelearn - Learning Roadmap Management System

A comprehensive web application for managing learning roadmaps and courses, built with a mobile-first approach and designed for easy deployment via Docker.

## 🚀 Features

### Core Functionality
- **Course Management**: Create, edit, and delete courses with multiple levels
- **Progress Tracking**: Track completion status for each course level
- **User Authentication**: Secure registration and login system
- **Admin Panel**: Administrative interface for course and user management
- **Mobile-First Design**: Fully responsive interface optimized for smartphones

### Technical Features
- **Docker Deployment**: Complete containerized stack with docker-compose
- **RESTful API**: Comprehensive backend API with logging
- **Database Persistence**: PostgreSQL with persistent volumes
- **System Logging**: Complete audit trail of all system actions
- **File Upload**: JSON course import functionality

## 📱 Mobile Experience

The application is designed mobile-first with:
- Responsive navigation optimized for touch
- Mobile-friendly forms and interfaces
- Optimized loading and performance
- Touch-friendly buttons and interactions
- Bottom navigation for easy thumb access

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Winston** - Logging framework
- **Multer** - File upload handling

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (optional)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### One-Command Deployment

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd homelearn
\`\`\`

2. Run the super deployment script:
\`\`\`bash
chmod +x super-deploy.sh
./super-deploy.sh
\`\`\`

3. Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Login**: admin@homelearn.com / admin123

## 📋 Course Structure

Courses are organized in levels, each containing:

- **Topics**: Key subjects covered in the level
- **Objectives**: Learning goals and outcomes
- **Tools**: Software and tools used
- **Resources**: Links and references

### Sample JSON Structure
\`\`\`json
{
  "title": "Course Title",
  "description": "Course description",
  "levels": [
    {
      "level": "1 - Level Name",
      "topics": ["Topic 1", "Topic 2"],
      "objectives": ["Objective 1", "Objective 2"],
      "tools": ["Tool 1", "Tool 2"],
      "resources": ["https://example.com", "Resource 2"]
    }
  ]
}
\`\`\`

## 👥 User Roles

### Regular Users
- Register and login
- Enroll in courses
- Track progress through course levels
- Mark levels as completed
- View personal dashboard

### Administrators
- All user capabilities
- Create and manage courses
- Upload courses via JSON
- View system and database logs
- Delete courses
- Access admin panel

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

### 1. Environment Setup
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 2. Database Setup
\`\`\`bash
docker-compose up -d database
# Wait for database to be ready
\`\`\`

### 3. Backend Setup
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

### 4. Frontend Setup
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)
- `POST /api/courses/upload` - Upload course JSON (Admin)

### User Progress
- `GET /api/my-courses` - Get enrolled courses
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/progress/:levelId` - Update progress

### Admin
- `GET /api/admin/logs` - System logs
- `GET /api/admin/db-logs` - Database logs

## 🗄 Database Schema

### Tables
- `users` - User accounts and authentication
- `courses` - Course information
- `course_levels` - Individual course levels
- `user_enrollments` - User course enrollments
- `user_progress` - Progress tracking
- `system_logs` - System activity logs
- `db_logs` - Database operation logs

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- SQL injection prevention

## 📱 Mobile Optimization

- Touch-friendly interface elements
- Responsive grid layouts
- Mobile navigation patterns
- Optimized form inputs
- Fast loading times
- Offline-ready architecture

## 🐳 Docker Configuration

### Services
- **frontend**: React application (port 3000)
- **backend**: Node.js API (port 5000)
- **database**: PostgreSQL (port 5432)

### Volumes
- `postgres_data`: Database persistence
- `backend_logs`: Application logs
- `course_uploads`: Uploaded files

## 📝 Logging

The application provides comprehensive logging:

### System Logs
- User authentication events
- Course management actions
- API access patterns
- Error tracking

### Database Logs
- Query execution times
- Connection status
- Performance metrics
- Error diagnostics

## 🔧 Configuration

### Environment Variables
\`\`\`bash
# Database
POSTGRES_DB=homelearn
POSTGRES_USER=homelearn_user
POSTGRES_PASSWORD=homelearn_pass

# Backend
NODE_ENV=production
JWT_SECRET=your_secret_key
DB_HOST=database
DB_PORT=5432

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

## 🚀 Deployment Options

### Development
\`\`\`bash
docker-compose -f docker-compose.dev.yml up
\`\`\`

### Production
\`\`\`bash
docker-compose up -d
\`\`\`

### Scaling
\`\`\`bash
docker-compose up -d --scale backend=3
\`\`\`

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, and 5432 are available
2. **Database connection**: Wait for database to fully initialize
3. **File permissions**: Ensure upload directories are writable
4. **Memory issues**: Increase Docker memory allocation if needed

### Logs
\`\`\`bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
\`\`\`

### Health Checks
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health
- Database: `docker-compose exec database pg_isready`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by learning management systems
- Designed for educational institutions and self-learners
- Mobile-first approach for accessibility

---

**homelearn** - Empowering learning through structured roadmaps 🚀
