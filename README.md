<<<<<<< HEAD
# TaskFlow — AI-Powered Enterprise Project & Task Management System

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.0.0--M3-blue.svg)](https://spring.io/projects/spring-ai)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](https://www.mysql.com/)

> **TaskFlow** is a production-grade, full-stack project and task management system designed with clean architecture, enterprise security, and purposeful AI capabilities. Built with **Spring Boot 3, Java 21, Spring AI, MySQL, React 18, TypeScript, and Tailwind CSS**.

---

## 1. Architectural Highlights & Technical Decisions

### Modular Monolith Architecture
```text
com.taskflow
├── config/         # Security, CORS, OpenAPI, and Data Seeding
├── security/       # JJWT 0.12.x tokens, Stateless Authentication Filter, UserDetailsService
├── auth/           # Registration (role-restricted), Login, Me endpoints & DTOs
├── user/           # User domain entity, repository, and employee directory service
├── project/        # Project CRUD, filtering, pagination, and soft-archiving
├── task/           # Task lifecycle, role-based status & progress updates, assignments
├── dependency/     # Directed graph task dependencies with DFS cycle prevention
├── comment/        # Threaded task discussions and real-time commentary
├── activity/       # Persistent audit logs for compliance & activity streams
├── dashboard/      # Role-specific analytics (Manager vs. Employee metrics)
├── ai/             # Spring AI ChatModel integration, structured JSON parsing & fallbacks
└── exception/      # Centralized GlobalExceptionHandler with standardized ApiResponse
```

### Key Technical Decisions for Technical Interviews
1. **Stateless JWT Security (`OncePerRequestFilter`)**:
   - Authentication is decoupled from session state, allowing horizontal scaling.
   - Self-registration is strictly restricted to `EMPLOYEE` role to prevent unauthorized privilege escalation.
   - Managers alone can create projects, assign deliverables, and approve AI generation plans.
2. **Circular Dependency Prevention Engine**:
   - Task dependencies form a Directed Acyclic Graph (DAG).
   - Before persisting a new dependency edge (`Task A -> Task B`), the service executes a Breadth-First/Depth-First Search (BFS/DFS) traversal on existing graph edges.
   - If a path from `Task B` to `Task A` already exists, an `IllegalArgumentException` is thrown immediately, preventing deadlock and cycles.
3. **Structured Spring AI with Graceful Degradation**:
   - Uses `org.springframework.ai.chat.model.ChatModel` with JSON schema enforcement.
   - **Pre-authorized context isolation**: The backend queries only authorized project and task records before calling the LLM, ensuring zero unauthorized data leaks.
   - **Deterministic heuristic fallback**: If `OPENAI_API_KEY` is not provided or the LLM provider experiences network downtime, the system dynamically activates structured algorithmic generators so the application never breaks.
4. **Information-Dense, Non-Decorative UI**:
   - Inspired by Linear and Jira: soft neutral surfaces (`#f8f9fb`), restrained indigo accents (`#4f46e5`), standard 8-point spacing, and purposeful charts via Recharts.

---

## 2. System Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 SPA (Vite + TS)                        │
│  - Linear-inspired UX      - Tailwind Design Tokens   - Axios Client   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Bearer JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Spring Boot 3.3.4 REST Application                   │
│                                                                        │
│  ┌───────────────────────┐         ┌────────────────────────────────┐  │
│  │ Security Gateway      │         │ Domain Controllers             │  │
│  │ - OncePerRequest JWT  │────────>│ - /api/auth, /api/projects     │  │
│  │ - BCrypt (Strength 12)│         │ - /api/tasks, /api/dashboard   │  │
│  │ - Method Authorization│         │ - /api/ai/**                   │  │
│  └───────────────────────┘         └───────────────┬────────────────┘  │
│                                                    │                   │
│                                    ┌───────────────▼────────────────┐  │
│                                    │ Service Layer & DFS Engine     │  │
│                                    │ - Transaction Boundaries       │  │
│                                    │ - Cycle Detection              │  │
│                                    │ - Risk Calculation (0-100)     │  │
│                                    └───────┬────────────────┬───────┘  │
└────────────────────────────────────────────┼────────────────┼──────────┘
                                             │                │
                        ┌────────────────────▼──┐   ┌─────────▼──────────┐
                        │    MySQL Database     │   │   LLM Provider     │
                        │ - Users, Projects     │   │ - OpenAI / SpringAI│
                        │ - Tasks, Dependencies │   │ - JSON Structured  │
                        │ - Comments, Audit Logs│   │ - Context Pre-Auth │
                        └───────────────────────┘   └────────────────────┘
```

---

## 3. Database Entity Relationship Diagram (ERD)

```text
+-------------------+       1 : N        +-----------------------+
|       USERS       |<------------------>|       PROJECTS        |
|-------------------|                    |-----------------------|
| id (BIGINT, PK)   |                    | id (BIGINT, PK)       |
| name (VARCHAR)    |                    | name (VARCHAR)        |
| email (VARCHAR, U)|                    | description (TEXT)    |
| password_hash     |                    | status (ENUM)         |
| role (MANAGER/EMP)|                    | manager_id (BIGINT,FK)|
| created_at, update|                    | archived (BOOLEAN)    |
+-------------------+                    +-----------------------+
          ^                                          ^
          │ 1 : N (Assignee)                         │ 1 : N
          ▼                                          ▼
+-------------------+       1 : N        +-----------------------+
|   TASK_COMMENTS   |<------------------>|         TASKS         |
|-------------------|                    |-----------------------|
| id (BIGINT, PK)   |                    | id (BIGINT, PK)       |
| task_id (FK)      |                    | title (VARCHAR)       |
| author_id (FK)    |                    | description (TEXT)    |
| content (TEXT)    |                    | priority, status(ENUM)|
| created_at        |                    | progress (INT, 0-100) |
+-------------------+                    | due_date (DATE)       |
          ^                              | project_id (FK)       |
          │                              | assignee_id (FK)      |
+-------------------+                    +-----------------------+
|  TASK_ACTIVITIES  |                                ▲   ▲
|-------------------|                                │   │ N : M
| id (BIGINT, PK)   |                                ▼   ▼
| task_id (FK)      |                    +-----------------------+
| actor_id (FK)     |                    |   TASK_DEPENDENCIES   |
| action, old/new   |                    |-----------------------|
| created_at        |                    | id (BIGINT, PK)       |
+-------------------+                    | task_id (BIGINT, FK)  |
                                         | depends_on_id (FK)    |
                                         +-----------------------+
```

---

## 4. Role-Based Permissions Matrix

| Resource & Action | MANAGER | EMPLOYEE |
|---|:---:|:---:|
| **Self-Registration** | ❌ (Forbidden) | ✅ Standard |
| **Create / Update Projects** | ✅ Owned Projects | ❌ Read-Only |
| **Archive / Restore Projects** | ✅ Owned Projects | ❌ Forbidden |
| **Create Tasks & Assign Employees** | ✅ Yes | ❌ Forbidden |
| **Update Task Status & Progress** | ✅ Full Access | ✅ Assigned Tasks Only |
| **Add / Delete Dependencies** | ✅ Manager Only | ❌ Forbidden |
| **Add Comments & View Audit History** | ✅ Yes | ✅ Yes |
| **Manager Dashboard (Project Risk & Rollups)** | ✅ Role Gated | ❌ Access Denied |
| **Employee Dashboard (Personal Workload)** | ✅ Yes | ✅ Role Gated |
| **Generate & Approve AI Task Plans** | ✅ Human-In-Loop | ❌ Forbidden |
| **AI Risk Analysis & Progress Summary** | ✅ Full Access | ✅ Read Context |
| **AI Assistant Chat & Task Implementation Plan** | ✅ Full Access | ✅ Authorized Tasks |

---

## 5. Quick Start & Setup Guide

### Prerequisites
- **Java 21** (Eclipse Adoptium or Oracle JDK)
- **Node.js 18+** & npm
- **MySQL 8.0+** (or Docker)

### Option A: Running with Docker Compose (Single Command)
```bash
# Clone and enter directory
cd "d:/Project 1"

# Copy environment variables
cp .env.example .env

# Start MySQL, Backend, and Frontend containers
docker-compose up --build -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

---

### Option B: Running Locally for Development

#### 1. Configure Database
Ensure MySQL is running on `localhost:3306`. Create database:
```sql
CREATE DATABASE taskflow_db;
```

#### 2. Run Spring Boot Backend
```bash
cd "d:/Project 1/backend"

# Build and run
mvn clean spring-boot:run
```
*Note: The application automatically initializes demo projects, tasks, comments, and users on first boot!*

#### 3. Run React Frontend
```bash
cd "d:/Project 1/frontend"

# Install and start dev server
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Seeded Demo Accounts

You can immediately sign in using either of the pre-seeded accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Manager** | `manager@taskflow.com` | `Password123!` | Full manager privileges, AI Plan generator, project creation |
| **Employee** | `alex@taskflow.com` | `Password123!` | Employee dashboard, assigned task updates, AI assistant |

---

## 7. Automated Test Suite

Run the full JUnit 5 and Mockito test suite covering authentication, role restrictions, circular dependency algorithms, and AI fallbacks:

```bash
cd "d:/Project 1/backend"
mvn test
```

### Verified Test Cases:
- `AuthServiceTest.register_ShouldEnforceEmployeeRole_AndReturnToken`: Verifies role-escalation defense.
- `AuthServiceTest.login_ShouldThrowBadCredentials_WhenPasswordInvalid`: Verifies BCrypt hash validation.
- `DependencyServiceTest.addDependency_ShouldPreventDirectCircularCycle`: Verifies immediate cycle rejection.
- `DependencyServiceTest.addDependency_ShouldPreventIndirectTransitiveCycle`: Verifies DFS traversal prevents multi-hop circular deadlocks.
- `AiServiceTest.analyzeProjectRisk_ShouldCalculateTransparentScoreAndIdentifyBlockedTasks`: Verifies rule-based score calculation (0-100).
- `AiServiceTest.generateTaskPlan_ShouldReturnStructuredPlan_UsingHeuristicFallbackWhenApiKeyMissing`: Verifies zero-downtime resilience.

---

## 8. REST API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Self-register employee account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated identity | Authenticated |
| `GET` | `/api/projects` | Paginated and filtered projects | Authenticated |
| `POST` | `/api/projects` | Create new project | Manager Only |
| `GET` | `/api/projects/{id}` | Detailed project view | Authenticated |
| `PATCH`| `/api/projects/{id}/archive` | Soft-archive project | Manager Only |
| `GET` | `/api/projects/{id}/tasks` | Get tasks belonging to project | Authenticated |
| `POST` | `/api/projects/{id}/tasks` | Create task inside project | Manager Only |
| `GET` | `/api/tasks/my` | Get current user's tasks | Authenticated |
| `PATCH`| `/api/tasks/{id}/status` | Update task status | Authorized Only |
| `PATCH`| `/api/tasks/{id}/progress` | Update task % progress | Authorized Only |
| `POST` | `/api/tasks/{id}/dependencies/{depId}` | Add task dependency | Manager Only |
| `DELETE`| `/api/tasks/{id}/dependencies/{depId}` | Remove task dependency | Manager Only |
| `GET` | `/api/dashboard/manager` | Manager KPI aggregation & risk | Manager Only |
| `GET` | `/api/dashboard/employee` | Employee schedule & deadlines | Employee Only |
| `POST` | `/api/ai/projects/{id}/task-plan` | Generate AI task specifications | Manager Only |
| `POST` | `/api/ai/projects/{id}/task-plan/approve`| Approve AI tasks into DB | Manager Only |
| `GET` | `/api/ai/projects/{id}/risk` | Transparent risk analysis (0-100) | Authenticated |
| `GET` | `/api/ai/projects/{id}/summary` | Verified facts vs recommendations | Authenticated |
| `POST` | `/api/ai/assistant/chat` | Context-bounded AI Assistant | Authenticated |
| `GET` | `/api/ai/tasks/{id}/implementation-plan` | Step-by-step task breakdown | Authenticated |

---

## 9. OpenAPI & Postman

- **Swagger / OpenAPI Documentation**: Visit `http://localhost:8080/swagger-ui.html` when backend is running.
- **Postman Collection**: Import [`taskflow-postman-collection.json`](file:///d:/Project%201/taskflow-postman-collection.json) directly into Postman to test all endpoints.
=======
# Ai-Powered-Project-Management-System
>>>>>>> 1ccc821fb5157cbb2f98ef6ad3b1022dd01c87ec
