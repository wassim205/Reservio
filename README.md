<div align="center">

# 🎫 Reservio

### Modern Event Reservation & Management Platform

[![CI](https://github.com/wassim205/Reservio/actions/workflows/ci.yml/badge.svg)](https://github.com/wassim205/Reservio/actions/workflows/ci.yml)
[![CD](https://github.com/wassim205/Reservio/actions/workflows/cd.yml/badge.svg)](https://github.com/wassim205/Reservio/actions/workflows/cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-UNLICENSED-gray)](LICENSE)

<p align="center">
  <strong>A full-stack event reservation system with role-based access control, real-time capacity management, and PDF ticket generation.</strong>
</p>

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[API Documentation](#-api-documentation) •
[Testing](#-testing) •
[Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Reservio** is a comprehensive web application designed to streamline event management and reservation processes for organizations such as training centers, companies, associations, or coworking spaces.

### The Problem

Organizations often manage events and registrations manually through spreadsheets, simple forms, and email exchanges, leading to:

- ❌ Lack of real-time visibility on available events and remaining seats
- ❌ Booking errors (duplicates, overbooking)
- ❌ Difficulty tracking reservation statuses
- ❌ Unreliable access control management
- ❌ No centralization of participant and booking history

### The Solution

Reservio provides a centralized, secure, and user-friendly platform that enables:

- ✅ Complete event lifecycle management (draft → published → cancelled)
- ✅ Real-time capacity tracking and overbooking prevention
- ✅ Automated reservation workflow (pending → confirmed → cancelled)
- ✅ Role-based access control (Admin / Participant)
- ✅ PDF ticket generation for confirmed reservations
- ✅ Dashboard with analytics and statistics

---

## ✨ Features

### 👤 For Participants

| Feature | Description |
|---------|-------------|
| 🔍 **Browse Events** | View all published events with filtering and search |
| 📝 **Event Details** | Access comprehensive event information (date, location, capacity) |
| 🎟️ **Make Reservations** | Book a spot on available events with instant feedback |
| 📊 **My Reservations** | Track all personal reservations and their statuses |
| ❌ **Cancel Booking** | Cancel reservations according to defined rules |
| 📄 **Download Tickets** | Get PDF tickets for confirmed reservations |

### 🔐 For Administrators

| Feature | Description |
|---------|-------------|
| ➕ **Create Events** | Create new events with all details (title, description, date, location, capacity) |
| ✏️ **Manage Events** | Edit, publish, or cancel events |
| 📋 **View Reservations** | Access all reservations by event or by participant |
| ✅ **Confirm/Refuse** | Approve or reject pending reservations |
| 📈 **Dashboard** | View statistics: upcoming events, fill rates, reservation breakdown |
| 👥 **User Management** | Manage participant accounts |

### 🔒 Security & Business Rules

- **Event Statuses**: `DRAFT` → `PUBLISHED` → `CANCELLED`
- **Reservation Statuses**: `PENDING` → `CONFIRMED` / `REFUSED` → `CANCELLED`
- Only `PUBLISHED` events are publicly visible
- Participants cannot book:
  - Cancelled or unpublished events
  - Fully booked events
  - Events they've already registered for
- Maximum capacity is strictly enforced
- PDF tickets only available for `CONFIRMED` reservations

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| ![NestJS](https://img.shields.io/badge/-NestJS-E0234E?logo=nestjs&logoColor=white) | Node.js framework with modular architecture |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | Type-safe JavaScript |
| ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white) | Next-generation ORM |
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | Relational database |
| ![JWT](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white) | Authentication & authorization |
| ![PDFKit](https://img.shields.io/badge/-PDFKit-FF0000) | PDF ticket generation |

### Frontend

| Technology | Purpose |
|------------|---------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white) | React framework with SSR/CSR |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | UI library |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | Type-safe JavaScript |
| ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white) | Utility-first CSS framework |
| ![Lucide](https://img.shields.io/badge/-Lucide-F56040) | Icon library |

### DevOps & Testing

| Technology | Purpose |
|------------|---------|
| ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white) | Containerization |
| ![GitHub Actions](https://img.shields.io/badge/-GitHub_Actions-2088FF?logo=githubactions&logoColor=white) | CI/CD pipeline |
| ![Jest](https://img.shields.io/badge/-Jest-C21325?logo=jest&logoColor=white) | Unit & integration testing |
| ![Playwright](https://img.shields.io/badge/-Playwright-45ba4b?logo=playwright&logoColor=white) | E2E testing |
| ![Testing Library](https://img.shields.io/badge/-Testing_Library-E33332?logo=testinglibrary&logoColor=white) | Component testing |

---

## 📁 Project Structure

```
Reservio/
├── 📂 apps/
│   ├── 📂 api/                    # NestJS Backend
│   │   ├── 📂 prisma/             # Database schema & migrations
│   │   │   ├── schema.prisma      # Prisma schema definition
│   │   │   ├── seed.ts            # Database seeding
│   │   │   └── 📂 migrations/     # Database migrations
│   │   ├── 📂 src/
│   │   │   ├── 📂 auth/           # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── 📂 dto/        # Data Transfer Objects
│   │   │   │   ├── 📂 guards/     # Authorization guards
│   │   │   │   └── 📂 decorators/ # Custom decorators
│   │   │   ├── 📂 events/         # Events management module
│   │   │   ├── 📂 registrations/  # Reservations module
│   │   │   ├── 📂 tickets/        # PDF ticket generation
│   │   │   ├── 📂 stats/          # Statistics & analytics
│   │   │   ├── 📂 users/          # User management
│   │   │   ├── app.module.ts      # Root module
│   │   │   └── main.ts            # Application entry point
│   │   ├── 📂 test/               # E2E tests
│   │   ├── Dockerfile             # Development Docker image
│   │   └── Dockerfile.prod        # Production Docker image
│   │
│   └── 📂 web/                    # Next.js Frontend
│       ├── 📂 app/
│       │   ├── 📂 (auth)/         # Authentication pages
│       │   │   ├── 📂 login/
│       │   │   └── 📂 register/
│       │   ├── 📂 admin/          # Admin dashboard
│       │   │   └── 📂 events/     # Event management
│       │   ├── 📂 events/         # Public event pages
│       │   │   └── 📂 [id]/       # Dynamic event details
│       │   └── 📂 api/            # API routes
│       ├── 📂 components/         # Reusable components
│       │   └── 📂 ui/             # UI components
│       ├── 📂 lib/                # Utilities & hooks
│       │   ├── api.ts             # API client
│       │   ├── auth-context.tsx   # Authentication context
│       │   ├── types.ts           # TypeScript types
│       │   └── validation.ts      # Form validation
│       ├── 📂 e2e/                # Playwright E2E tests
│       ├── Dockerfile             # Development Docker image
│       └── Dockerfile.prod        # Production Docker image
│
├── 📂 .github/
│   └── 📂 workflows/
│       ├── ci.yml                 # Continuous Integration
│       └── cd.yml                 # Continuous Deployment
│
├── docker-compose.yml             # Development environment
├── docker-compose.prod.yml        # Production environment
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Docker** & **Docker Compose**
- **PostgreSQL** 15+ (or use Docker)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/wassim205/Reservio.git
cd Reservio

# Start all services (database, API, web)
docker compose up -d

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - Database: localhost:5432
```

### Manual Setup

#### 1. Backend Setup

```bash
# Navigate to API directory
cd apps/api

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed the database (optional)
pnpm db:seed

# Start development server
pnpm start:dev
```

#### 2. Frontend Setup

```bash
# Navigate to web directory
cd apps/web

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

---

## 🔐 Environment Variables

### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reservio?schema=public

# Server
API_PORT=4000

# JWT Secrets (use strong random strings in production)
ACCESS_TOKEN_SECRET=your-access-token-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
```

### Frontend (`apps/web/.env.local`)

```env
# API URL (use internal Docker network URL when containerized)
NEXT_PUBLIC_API_URL=http://localhost:4000
API_URL=http://api:4000  # For SSR calls within Docker network

# Server
WEB_PORT=3000
```

### `.env.example` Files

Both `apps/api` and `apps/web` should include `.env.example` files documenting all required environment variables for easy setup.

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (SSR/CSR)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Public Pages│  │ Auth Pages  │  │   Admin Dashboard       │  │
│  │    (SSR)    │  │   (CSR)     │  │       (CSR)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼ JWT Auth
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS API SERVER                          │
│  ┌───────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │   Auth    │  │   Events   │  │Registrations│  │  Tickets │  │
│  │  Module   │  │   Module   │  │   Module    │  │  Module  │  │
│  └───────────┘  └────────────┘  └─────────────┘  └──────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Guards & Middleware                     │  │
│  │              (JWT Auth, Role-based Access)                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                        │
│  ┌───────────┐  ┌────────────┐  ┌─────────────────────────────┐ │
│  │   Users   │  │   Events   │  │       Registrations         │ │
│  └───────────┘  └────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌──────────────────┐       ┌───────────────────┐       ┌──────────────────────┐
│      User        │       │      Event        │       │    Registration      │
├──────────────────┤       ├───────────────────┤       ├──────────────────────┤
│ id: String (PK)  │       │ id: String (PK)   │       │ id: String (PK)      │
│ fullname: String │       │ title: String     │       │ status: Enum         │
│ email: String    │◄──────│ description: Text │       │ - PENDING            │
│ password: String │       │ location: String  │       │ - CONFIRMED          │
│ role: Enum       │       │ startDate: Date   │       │ - CANCELLED          │
│ - ADMIN          │       │ endDate: Date     │       │                      │
│ - PARTICIPANT    │       │ capacity: Int     │◄──────┤ eventId: FK          │
│                  │       │ status: Enum      │       │ userId: FK           │
│ createdAt: Date  │       │ - DRAFT           │       │                      │
│ updatedAt: Date  │       │ - PUBLISHED       │       │ createdAt: Date      │
└──────────────────┘       │ - CANCELLED       │       │ updatedAt: Date      │
         │                 │                   │       └──────────────────────┘
         │                 │ createdById: FK   │                 ▲
         │                 │ createdAt: Date   │                 │
         │                 │ updatedAt: Date   │                 │
         │                 └───────────────────┘                 │
         │                          ▲                            │
         │                          │                            │
         └──────────────────────────┴────────────────────────────┘
                              1:N Relationships
```

---

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new participant | ❌ |
| `POST` | `/auth/login` | Login and get JWT tokens | ❌ |
| `POST` | `/auth/refresh` | Refresh access token | 🔐 |
| `POST` | `/auth/logout` | Logout and invalidate tokens | 🔐 |
| `GET`  | `/auth/me` | Get current user profile | 🔐 |

### Events

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| `GET` | `/events` | List all published events | ❌ | - |
| `GET` | `/events/:id` | Get event details | ❌ | - |
| `POST` | `/events` | Create a new event | 🔐 | Admin |
| `PATCH` | `/events/:id` | Update event | 🔐 | Admin |
| `DELETE` | `/events/:id` | Delete event | 🔐 | Admin |
| `POST` | `/events/:id/publish` | Publish event | 🔐 | Admin |
| `POST` | `/events/:id/cancel` | Cancel event | 🔐 | Admin |

### Registrations

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| `GET` | `/registrations` | List user's registrations | 🔐 | Participant |
| `GET` | `/registrations/all` | List all registrations | 🔐 | Admin |
| `POST` | `/registrations` | Create a reservation | 🔐 | Participant |
| `POST` | `/registrations/:id/confirm` | Confirm registration | 🔐 | Admin |
| `POST` | `/registrations/:id/refuse` | Refuse registration | 🔐 | Admin |
| `POST` | `/registrations/:id/cancel` | Cancel registration | 🔐 | Both |

### Tickets

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/tickets/:registrationId` | Download PDF ticket | 🔐 |

### Statistics (Admin)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| `GET` | `/stats` | Get dashboard statistics | 🔐 | Admin |

---

## 🧪 Testing

### Backend Tests

```bash
cd apps/api

# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Frontend Tests

```bash
cd apps/web

# Component tests (Jest + Testing Library)
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

### Test Coverage

| Module | Unit Tests | E2E Tests |
|--------|------------|-----------|
| Authentication | ✅ | ✅ |
| Events | ✅ | ✅ |
| Registrations | ✅ | ✅ |
| Tickets | ✅ | ✅ |
| Role Guards | ✅ | ✅ |

---

## 🐳 Deployment

### Docker Compose (Development)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild images
docker compose up -d --build
```

### Docker Compose (Production)

```bash
# Start production environment
docker compose -f docker-compose.prod.yml up -d

# With environment variables
docker compose -f docker-compose.prod.yml up -d --env-file .env.prod
```

### Docker Images

Production images are automatically built and published to Docker Hub via the CD pipeline:

```bash
# Pull latest images
docker pull wassim205/reservio-api:latest
docker pull wassim205/reservio-web:latest

# Run with specific version
docker pull wassim205/reservio-api:abc1234
docker pull wassim205/reservio-web:abc1234
```

---

## 🔄 CI/CD Pipeline

### Continuous Integration (CI)

Triggered on every `push` and `pull_request` to `main` and `dev` branches.

```yaml
Jobs:
  ├── API
  │   ├── Install dependencies (with pnpm cache)
  │   ├── Generate Prisma client
  │   ├── TypeScript check
  │   ├── ESLint
  │   ├── Run tests
  │   └── Build
  │
  └── Web
      ├── Install dependencies (with pnpm cache)
      ├── TypeScript check
      ├── ESLint
      ├── Run tests
      └── Build
```

### Continuous Deployment (CD)

Triggered on `push` to `dev` branch.

```yaml
Jobs:
  ├── Publish API Image
  │   ├── Build Docker image
  │   └── Push to Docker Hub (latest + commit SHA tag)
  │
  └── Publish Web Image
      ├── Build Docker image
      └── Push to Docker Hub (latest + commit SHA tag)
```

### Pipeline Status

| Workflow | Status | Trigger |
|----------|--------|---------|
| CI | [![CI](https://github.com/wassim205/Reservio/actions/workflows/ci.yml/badge.svg)](https://github.com/wassim205/Reservio/actions/workflows/ci.yml) | Push/PR to main, dev |
| CD | [![CD](https://github.com/wassim205/Reservio/actions/workflows/cd.yml/badge.svg)](https://github.com/wassim205/Reservio/actions/workflows/cd.yml) | Push to dev |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/RSV-XX-amazing-feature`)
3. Commit your changes with ticket reference (`git commit -m 'RSV-XX: Add amazing feature'`)
4. Push to the branch (`git push origin feature/RSV-XX-amazing-feature`)
5. Open a Pull Request

### Commit Convention

Use JIRA ticket references in commit messages:

```
RSV-42: Add user authentication
RSV-43: Fix event capacity validation
RSV-44: Update registration workflow
```

---

## 📝 License

This project is **UNLICENSED** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Wassim** - [GitHub](https://github.com/wassim205)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ using NestJS, Next.js, and TypeScript

</div>
