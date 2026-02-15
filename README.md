# Multilingual Mandi

AI-powered multilingual marketplace platform that eliminates language barriers in Indian commerce through real-time translation.

## Project Structure

This is a monorepo containing:
- `packages/backend` - Node.js/Express API server with TypeScript
- `packages/frontend` - React.js frontend with TypeScript and TailwindCSS

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start database services:**
   ```bash
   docker-compose up -d
   ```

3. **Set up backend environment:**
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- Backend API server on http://localhost:3001
- Frontend React app on http://localhost:3000

## Development Commands

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both packages for production
- `npm run test` - Run tests for both packages
- `npm run lint` - Lint both packages

## Database Management

- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed the database with initial data
- `npm run db:generate` - Generate Prisma client

## Architecture

The system uses:
- **Backend**: Express.js with TypeScript, Prisma ORM, Socket.io for real-time features
- **Frontend**: React.js with TypeScript, TailwindCSS, React Query for state management
- **Database**: PostgreSQL with Redis for caching and sessions
- **Real-time**: Socket.io for chat and live updates

## Features (Planned)

- ✅ Project foundation and infrastructure
- 🔄 User authentication with language preferences
- 🔄 Multilingual product catalog
- 🔄 AI-powered real-time translation
- 🔄 Search and discovery across languages
- 🔄 Real-time chat and negotiation
- 🔄 Trust scoring and reputation system
- 🔄 Vendor and buyer dashboards
- 🔄 Cultural localization
- 🔄 Mobile responsiveness

## Contributing

This project follows the spec-driven development methodology. See `.kiro/specs/multilingual-mandi/` for detailed requirements, design, and implementation tasks.