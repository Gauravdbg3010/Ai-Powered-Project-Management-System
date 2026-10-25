# Project Structure & Directory Layout

> Complete file tree and directory organization reference for **TaskFlow — AI-Powered Project Management System**.

---

## 1. Top-Level Repository Organization

```text
Ai-Powered-Project-Management-System/
├── .github/                    # GitHub actions & issue workflows
├── backend/                    # Spring Boot 3.3.4 (Java 21 LTS) Application
├── frontend/                   # React 18, Vite 5, TypeScript 5 SPA
├── docs/                       # Official architectural & operational documentation
├── taskflow-postman-collection.json  # Ready-to-import Postman API test collection
├── PROJECT_DOCUMENTATION.md    # Unified complete technical reference
├── README.md                   # Repository overview & quickstart badges
└── .gitignore                  # Git tracking rules
```

---

## 2. Backend Architecture Layout (`backend/`)

```text
backend/
├── pom.xml                                  # Maven dependencies (Spring Boot, Spring AI, JJWT, SpringDoc)
├── mvnw / mvnw.cmd                          # Maven wrapper binaries
├── Dockerfile                               # Production multi-stage Docker build container
└── src/
    ├── main/
    │   ├── java/com/taskflow/
    │   │   ├── TaskflowApplication.java     # Main application bootstrap & @SpringBootApplication
    │   │   ├── config/                      # Cross-cutting configurations
    │   │   │   ├── SecurityConfig.java      # Spring Security filter chain & URL permit rules
    │   │   │   ├── CorsConfig.java          # Cross-Origin Resource Sharing policy for Vercel
    │   │   │   ├── OpenApiConfig.java       # Swagger / OpenAPI metadata
    │   │   │   └── DataInitializer.java     # Demo data seeder (users, projects, tasks, DAGs)
    │   │   ├── security/                    # Authentication engine
    │   │   │   ├── JwtUtil.java             # HS512 JWT generation, parsing & validation
    │   │   │   ├── JwtAuthFilter.java       # OncePerRequestFilter extracting Bearer tokens
    │   │   │   └── UserDetailsServiceImpl.java  # Spring Security UserDetailsService bridge
    │   │   ├── auth/                        # Authentication & onboarding domain
    │   │   │   ├── AuthController.java      # /api/auth/register, /api/auth/login, /api/auth/me
    │   │   │   ├── AuthService.java         # Password hashing & authentication logic
    │   │   │   └── dto/                     # AuthRequest, AuthResponse, RegisterRequest
    │   │   ├── user/                        # Team directory domain
    │   │   │   ├── User.java                # JPA Entity with Role enum (MANAGER, EMPLOYEE)
    │   │   │   ├── UserRepository.java      # JPA Repository with custom email finders
    │   │   │   ├── UserService.java         # User lookup & directory services
    │   │   │   └── UserController.java      # /api/users endpoints
    │   │   ├── project/                     # Project initiatives domain
    │   │   │   ├── Project.java             # JPA Entity with status, dates, owner
    │   │   │   ├── ProjectRepository.java   # JPA queries with eager joins
    │   │   │   ├── ProjectService.java      # Creation, updates, soft-archival
    │   │   │   ├── ProjectController.java   # /api/projects CRUD endpoints
    │   │   │   └── dto/                     # ProjectRequest, ProjectResponse DTOs
    │   │   ├── task/                        # Deliverables & Kanban domain
    │   │   │   ├── Task.java                # JPA Entity with status, priority, progress
    │   │   │   ├── TaskRepository.java      # Filter queries by project & assignee
    │   │   │   ├── TaskService.java         # Lifecycle transitions & audit dispatch
    │   │   │   ├── TaskController.java      # /api/tasks endpoints
    │   │   │   └── dto/                     # TaskRequest, TaskResponse, TaskStatusUpdate
    │   │   ├── dependency/                  # Directed Graph (DAG) domain
    │   │   │   ├── TaskDependency.java      # Join entity for task-prerequisite edges
    │   │   │   ├── TaskDependencyRepository.java
    │   │   │   ├── DependencyService.java   # BFS cycle detection algorithm
    │   │   │   └── DependencyController.java# /api/dependencies endpoints
    │   │   ├── comment/                     # Threaded discussions domain
    │   │   │   ├── TaskComment.java         # JPA Entity
    │   │   │   ├── TaskCommentRepository.java
    │   │   │   ├── CommentService.java
    │   │   │   └── CommentController.java   # /api/tasks/{id}/comments
    │   │   ├── activity/                    # Immutable audit logging domain
    │   │   │   ├── TaskActivity.java        # JPA Entity tracking state transitions
    │   │   │   ├── TaskActivityRepository.java
    │   │   │   └── ActivityController.java  # /api/tasks/{id}/activities
    │   │   ├── dashboard/                   # Operational metrics domain
    │   │   │   ├── DashboardService.java    # Aggregates manager vs employee KPI metrics
    │   │   │   ├── DashboardController.java # /api/dashboard/manager, /api/dashboard/employee
    │   │   │   └── dto/                     # Dashboard metric transfer objects
    │   │   ├── ai/                          # Spring AI orchestration domain
    │   │   │   ├── AiService.java           # LLM client invocation & heuristic fallback
    │   │   │   ├── AiController.java        # /api/ai/generate-plan, /risk-analysis
    │   │   │   └── dto/                     # AiTaskPlanResponse, AiRiskResponse
    │   │   └── exception/                   # Error translation
    │   │       ├── GlobalExceptionHandler.java # Translates exceptions to standardized JSON
    │   │       └── ApiResponse.java         # Generic JSON envelope {success, message, data}
    │   └── resources/
    │       ├── application.properties       # Global shared properties
    │       ├── application-h2.properties    # In-memory H2 configuration
    │       └── application-mysql.properties # MySQL production configuration
    └── test/java/com/taskflow/               # JUnit 5 & Mockito test suites
        ├── auth/AuthServiceTest.java
        ├── dependency/DependencyServiceTest.java
        └── ai/AiServiceTest.java
```

---

## 3. Frontend Architecture Layout (`frontend/`)

```text
frontend/
├── package.json               # Dependencies (React 18, React Router 6, Axios, Recharts, Lucide)
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite development & build plugins
├── tailwind.config.js         # Tailwind CSS theme tokens & utility classes
├── vercel.json                # SPA rewrite rules for direct Vercel routing
├── index.html                 # Single page application entry HTML
└── src/
    ├── main.tsx               # ReactDOM mount point
    ├── App.tsx                # React Router root with ProtectedRoute hierarchy
    ├── index.css              # Global Tailwind imports & custom surface classes
    ├── vite-env.d.ts          # Vite environment variable TypeScript interfaces
    ├── api/                   # Networking & client configuration
    │   └── client.ts          # Axios singleton with Bearer interceptor & 90s timeout
    ├── context/               # Global state
    │   └── AuthContext.tsx    # User token, role, and authentication status
    ├── components/            # Reusable UI component library
    │   ├── Button.tsx         # Accessible button with loading spinner
    │   ├── Input.tsx          # Form inputs with label & error handling
    │   ├── Modal.tsx          # Accessible dialog overlays
    │   ├── Badge.tsx          # Color-coded status & priority badges
    │   ├── Navbar.tsx         # Top navigational bar
    │   ├── Sidebar.tsx        # Collapsible side navigation with role filtering
    │   └── ProtectedRoute.tsx # Route guard enforcing authentication & role check
    └── pages/                 # Route views
        ├── auth/
        │   ├── LoginPage.tsx      # Login form with quick-fill presets & cold-start guidance
        │   └── RegisterPage.tsx   # Sign-up form with role assignment
        ├── dashboard/
        │   ├── ManagerDashboard.tsx   # High-level KPIs, project health, AI risk triggers
        │   └── EmployeeDashboard.tsx  # Personal assignments, deadlines, velocity
        ├── projects/
        │   ├── ProjectListPage.tsx    # Grid of active & planned initiatives
        │   ├── ProjectDetailPage.tsx  # Project milestones, progress, task breakdown
        │   └── CreateProjectModal.tsx # Project creation modal with AI plan generator
        └── tasks/
            ├── KanbanBoardPage.tsx    # Drag-and-drop / column-based task board
            ├── TaskDetailPage.tsx     # Task specs, comments, audit activity stream
            └── DependenciesModal.tsx  # DAG dependency visualizer & linking tool
```
