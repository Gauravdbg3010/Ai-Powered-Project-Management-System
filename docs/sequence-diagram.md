# System Sequence Diagrams

> Sequence diagrams illustrating end-to-end communication flows across client, backend, database, and AI components in **TaskFlow — AI-Powered Project Management System**.

---

## 1. Authentication & JWT Authorization Flow

Illustrates user credential authentication, token generation, and subsequent authorized API requests.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Browser / Client
    participant Filter as JwtAuthFilter
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant UserRepo as UserRepository
    participant JwtUtil as JwtUtil
    participant ProjCtrl as ProjectController

    Client->>AuthCtrl: POST /api/auth/login {email, password}
    AuthCtrl->>AuthSvc: login(LoginRequest)
    AuthSvc->>UserRepo: findByEmail(email)
    UserRepo-->>AuthSvc: User Entity (BCrypt hash)
    AuthSvc->>AuthSvc: passwordEncoder.matches(raw, hash)
    AuthSvc->>JwtUtil: generateToken(email, role, id)
    JwtUtil-->>AuthSvc: Signed JWT Token (HS512)
    AuthSvc-->>AuthCtrl: AuthResponse {token, role, name}
    AuthCtrl-->>Client: 200 OK (Store token in localStorage)

    Note over Client,ProjCtrl: Subsequent Protected API Request
    Client->>Filter: GET /api/projects (Authorization: Bearer <token>)
    Filter->>JwtUtil: validateToken(token)
    JwtUtil-->>Filter: Valid Claims (email, role: "MANAGER", id: 1)
    Filter->>Filter: Set SecurityContextHolder(Authentication)
    Filter->>ProjCtrl: GET /api/projects
    ProjCtrl-->>Client: 200 OK [List of Projects]
```

---

## 2. AI Work Breakdown Generation & Human-in-the-Loop Review Flow

Illustrates how an Engineering Lead enters project context, receives structured AI task recommendations, reviews them, and commits them to the database.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Engineering Lead
    participant Frontend as React Client
    participant AiCtrl as AiController
    participant AiSvc as AiService
    participant LLM as Google Gemini / Heuristics
    participant TaskRepo as TaskRepository

    Manager->>Frontend: Click "Generate AI Work Breakdown" (Input project context)
    Frontend->>AiCtrl: POST /api/ai/generate-plan {projectId, projectContext}
    AiCtrl->>AiSvc: generateTaskPlan(request)
    alt Gemini API Key Configured
        AiSvc->>LLM: Prompt Template + JSON Schema Enforcement
        LLM-->>AiSvc: Structured JSON (Tasks, Durations, Roles, Acceptance Criteria)
    else API Key Missing / Network Outage
        AiSvc->>AiSvc: Execute Deterministic Local Heuristic Engine
    end
    AiSvc-->>AiCtrl: AiTaskPlanResponse
    AiCtrl-->>Frontend: 200 OK (Render interactive preview modal)

    Note over Manager,Frontend: Human-in-the-Loop Approval Step
    Manager->>Frontend: Review tasks, edit durations, deselect unwanted tasks
    Manager->>Frontend: Click "Approve & Add to Sprint"
    Frontend->>TaskRepo: POST /api/tasks (Batch commit selected tasks)
    TaskRepo-->>Frontend: 201 Created (Tasks added to Kanban board)
    Frontend-->>Manager: Updated Project View with New Tasks
```

---

## 3. Task Dependency Creation & BFS Cycle Detection Flow

Illustrates how the Directed Acyclic Graph (DAG) cycle detection algorithm prevents dependency deadlocks.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Engineering Lead
    participant DepCtrl as DependencyController
    participant DepSvc as DependencyService
    participant DepRepo as TaskDependencyRepository
    participant DB as Relational Database

    Manager->>DepCtrl: POST /api/dependencies {taskId: 3, dependsOnId: 1}
    DepCtrl->>DepSvc: addDependency(3, 1)
    DepSvc->>DepRepo: findAllDependenciesForProject(projectId)
    DepRepo-->>DepSvc: Current Dependency Graph Edges
    DepSvc->>DepSvc: Run BFS Traversal: Can Task 1 reach Task 3?
    
    alt Circular Path Found (Cycle Detected)
        DepSvc-->>DepCtrl: Throw IllegalArgumentException("Circular dependency detected")
        DepCtrl-->>Manager: 400 Bad Request ("Adding this dependency would create a cycle")
    else Graph is Acyclic (Valid)
        DepSvc->>DepRepo: save(TaskDependency {task: 3, dependsOn: 1})
        DepRepo->>DB: INSERT INTO task_dependencies ...
        DB-->>DepRepo: Saved Entity
        DepSvc-->>DepCtrl: Dependency Created
        DepCtrl-->>Manager: 201 Created (Dependency Edge Added)
    end
```

---

## 4. Task State Transition & Audit Activity Recording Flow

Illustrates an engineer updating a task status on the Kanban board and the automatic generation of an immutable compliance audit record.

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Product Engineer
    participant Frontend as Kanban Board
    participant TaskCtrl as TaskController
    participant TaskSvc as TaskService
    participant TaskRepo as TaskRepository
    participant ActRepo as TaskActivityRepository
    participant DB as Relational Database

    Engineer->>Frontend: Drag Task from "IN_PROGRESS" to "COMPLETED"
    Frontend->>TaskCtrl: PATCH /api/tasks/4/status {status: "COMPLETED", progress: 100}
    TaskCtrl->>TaskSvc: updateTaskStatus(4, request, currentUser)
    TaskSvc->>TaskRepo: findById(4)
    TaskRepo-->>TaskSvc: Task Entity (Old Status: "IN_PROGRESS")
    
    TaskSvc->>TaskSvc: task.setStatus("COMPLETED"); task.setProgress(100);
    TaskSvc->>TaskRepo: save(task)
    TaskRepo->>DB: UPDATE tasks SET status='COMPLETED', progress=100 WHERE id=4
    
    Note over TaskSvc,ActRepo: Automatic Immutable Audit Logging
    TaskSvc->>ActRepo: save(TaskActivity {task: 4, actor: currentUser, action: "STATUS_CHANGED", old: "IN_PROGRESS", new: "COMPLETED"})
    ActRepo->>DB: INSERT INTO task_activities ...
    
    TaskSvc-->>TaskCtrl: Updated Task DTO
    TaskCtrl-->>Frontend: 200 OK (Refresh Kanban card & activity feed)
    Frontend-->>Engineer: Visual confirmation & completed badge
```
