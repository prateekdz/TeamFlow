# Team Flow

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.4-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-black)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-orange)](https://clerk.com/)
[![Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, full-stack task management application built with cutting-edge technologies. Team Flow enables teams to collaborate efficiently on projects, manage tasks, and track progress with real-time updates and secure authentication.

## 🚀 Features

### Core Functionality
- **Project Management**: Create, organize, and manage multiple projects
- **Task Tracking**: Comprehensive task lifecycle management with status updates
- **Team Collaboration**: Invite members, assign tasks, and share responsibilities
- **Real-time Updates**: Live synchronization across all connected clients
- **Advanced Filtering**: Filter tasks by status, assignee, priority, and due dates

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Intuitive UI**: Clean, modern interface built with Radix UI components
- **Dark/Light Mode**: Theme switching for comfortable viewing
- **Accessibility**: WCAG-compliant components and keyboard navigation

### Security & Performance
- **Secure Authentication**: Clerk-powered authentication with social logins
- **Role-based Access**: Granular permissions for projects and tasks
- **Optimized Performance**: Fast loading with Vite bundling and code splitting
- **Database Optimization**: Efficient queries with Drizzle ORM

## 🛠 Tech Stack

### Frontend
- **React 19.1.4** - Modern React with concurrent features
- **Vite 7.3.2** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI components
- **React Query** - Powerful data fetching and caching
- **Wouter** - Lightweight routing library

### Backend
- **Node.js 20+** - Runtime environment
- **Express 5.1.0** - Fast, minimalist web framework
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe SQL query builder
- **Clerk** - Authentication and user management

### Development & Deployment
- **ESLint** - Code linting and formatting
- **Vitest** - Unit testing framework
- **Railway** - Full-stack deployment platform
- **Vercel** - Frontend deployment and CDN

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** >= 20.19.0 (required for Vite 7.3.2)
- **npm** >= 10.0.0 or **yarn** >= 1.22.0
- **PostgreSQL** >= 15.0
- **Git** for version control

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prateekdz/TeamFlow.git
   cd TeamFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables in `.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/teamflow

   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
   CLERK_SECRET_KEY=sk_test_your_secret_key
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key

   # Server Configuration
   NODE_ENV=development
   PORT=3000
   CLIENT_PORT=5173
   BASE_PATH=/
   LOG_LEVEL=info

   # Production API Base URL (for deployed frontend)
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push

   # Optional: Generate types
   npm run db:generate
   ```

## 🚀 Running the Application

### Development Mode
```bash
# Start both frontend and backend in development
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Build
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

### Additional Scripts
```bash
# Run linting
npm run lint

# Start backend server only
npm run server

# Preview production build
npm run preview
```

## 📡 API Documentation

### Authentication Endpoints
- `GET /api/healthz` - Health check
- `POST /api/auth/*` - Clerk authentication routes

### Project Endpoints
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Task Endpoints
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Member Management
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Add project member
- `DELETE /api/projects/:id/members/:userId` - Remove member

## 🚀 Deployment

### Railway (Full-Stack)
1. Connect your GitHub repository to Railway
2. Configure Railway service commands:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Set environment variables in Railway dashboard
4. Railway will automatically detect and deploy the application
5. Run database migrations in Railway terminal:
   ```bash
   npx drizzle-kit push --config drizzle.config.js
   ```

Important:
- Set `PORT` to Railway's injected port only if you are overriding it manually. In most cases Railway provides it automatically.
- If `NODE_ENV` is not set by Railway, the server now treats Railway runtime variables as production so it serves `dist/public` instead of redirecting to the Vite dev server.

### Vercel (Frontend Only)
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
3. Set environment variables for Clerk and API base URL

### Environment Variables for Production
```env
# Railway/Vercel Environment Variables
DATABASE_URL=your_production_db_url
CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
VITE_API_BASE_URL=https://your-railway-app.up.railway.app
PORT=3000
NODE_ENV=production
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com/) for authentication
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Drizzle ORM](https://orm.drizzle.team/) for database management

## 📞 Support

If you have any questions or need help:

- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

---

**Built with ❤️ by the Prateek**

```bash
npm run dev
```

The API runs on `PORT` and Vite runs on `CLIENT_PORT`.

## Scripts

- `npm run dev` starts the API and frontend together.
- `npm run start` starts the API server.
- `npm run build` builds the frontend into `dist/public`.
- `npm run test` runs the Node test suite.
- `npm run lint` runs ESLint.
- `npm run db:push` pushes the Drizzle schema to PostgreSQL.

Made by Prateek Dwivedi
