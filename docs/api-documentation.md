# TaskFlow API Documentation

> Complete REST API specification for **TaskFlow — AI-Powered Project Management System**.  
> Base Production URL: `https://ai-powered-project-management-system-2e5f.onrender.com/api`  
> Local Base URL: `http://localhost:8080/api`  
> Interactive Swagger UI: [https://ai-powered-project-management-system-2e5f.onrender.com/swagger-ui.html](https://ai-powered-project-management-system-2e5f.onrender.com/swagger-ui.html)

---

## 1. Authentication Standards

All protected endpoints require an HTTP `Authorization` header containing a valid Bearer JWT:
```http
Authorization: Bearer <your-jwt-token>
```

Tokens are signed using HMAC-SHA512 (`HS512`) and expire after 24 hours (86,400,000 ms).

### Standard Response Format
All API responses follow a unified envelope:
```json
{
  "success": true,
  "message": "Operation successful description",
  "data": { ... }
}
```

In case of error (e.g. 400, 401, 403, 404, 500):
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": {
    "field": "Validation message"
  }
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Register New Account
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Registers a new user. For security, self-registration always assigns the `EMPLOYEE` role.
- **Request Body**:
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@company.com",
  "password": "Password123!"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "type": "Bearer",
    "id": 5,
    "name": "Alex Mercer",
    "email": "alex.mercer@company.com",
    "role": "EMPLOYEE"
  }
}
```

### 2.2 Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials and issues a signed JWT.
- **Request Body**:
```json
{
  "email": "sarah.chen@taskflow.dev",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "type": "Bearer",
    "id": 1,
    "name": "Sarah Chen",
    "email": "sarah.chen@taskflow.dev",
    "role": "MANAGER"
  }
}
```

### 2.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`EMPLOYEE` or `MANAGER`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": 1,
    "name": "Sarah Chen",
    "email": "sarah.chen@taskflow.dev",
    "role": "MANAGER"
  }
}
```

---

## 3. User & Team Directory Endpoints (`/api/users`)

### 3.1 List All Team Members
- **Endpoint**: `GET /api/users`
- **Access**: Authenticated
- **Description**: Returns all active team members (Engineers and Leads) for task assignment.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Sarah Chen",
      "email": "sarah.chen@taskflow.dev",
      "role": "MANAGER"
    },
    {
      "id": 2,
      "name": "Marcus Vance",
      "email": "marcus.vance@taskflow.dev",
      "role": "EMPLOYEE"
    }
  ]
}
```

---

## 4. Projects Endpoints (`/api/projects`)

### 4.1 List Projects
- **Endpoint**: `GET /api/projects`
- **Access**: Authenticated
- **Query Parameters**:
  - `archived` (boolean, default: `false`)
- **Response (200 OK)**: Array of Project summary objects with manager details and task counts.

### 4.2 Get Project Details
- **Endpoint**: `GET /api/projects/{id}`
- **Access**: Authenticated
- **Response (200 OK)**: Single project with full task list, completion percentage, and date milestones.

### 4.3 Create Project
- **Endpoint**: `POST /api/projects`
- **Access**: `MANAGER` only
- **Request Body**:
```json
{
  "name": "Mobile Banking Platform v2",
  "description": "Next-generation retail banking APIs with biometric auth.",
  "startDate": "2026-11-01",
  "endDate": "2027-02-28"
}
```

### 4.4 Update Project
- **Endpoint**: `PUT /api/projects/{id}`
- **Access**: `MANAGER` only
- **Request Body**: Same schema as project creation.

### 4.5 Archive Project (Soft Delete)
- **Endpoint**: `PATCH /api/projects/{id}/archive`
- **Access**: `MANAGER` only
- **Response (200 OK)**: Marks project as archived (`archived = true`).

---

## 5. Tasks Endpoints (`/api/tasks`)

### 5.1 List Tasks
- **Endpoint**: `GET /api/tasks`
- **Access**: Authenticated
- **Query Parameters**:
  - `projectId` (Long, optional)
  - `assigneeId` (Long, optional)
  - `status` (Enum: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`)
  - `priority` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)

### 5.2 Create Task
- **Endpoint**: `POST /api/tasks`
- **Access**: `MANAGER` only
- **Request Body**:
```json
{
  "title": "Implement OAuth2 Token Revocation",
  "description": "Expose RFC 7009 token revocation endpoint.",
  "status": "TODO",
  "priority": "HIGH",
  "progress": 0,
  "dueDate": "2026-11-15",
  "projectId": 1,
  "assigneeId": 2
}
```

### 5.3 Update Task (Full)
- **Endpoint**: `PUT /api/tasks/{id}`
- **Access**: `MANAGER` only

### 5.4 Update Status / Progress (Engineers & Managers)
- **Endpoint**: `PATCH /api/tasks/{id}/status`
- **Access**: Authenticated (Assignee or Manager)
- **Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "progress": 45
}
```

### 5.5 Delete Task
- **Endpoint**: `DELETE /api/tasks/{id}`
- **Access**: `MANAGER` only

---

## 6. Task Dependencies (DAG) Endpoints (`/api/dependencies`)

### 6.1 Add Dependency Prerequisite
- **Endpoint**: `POST /api/dependencies`
- **Access**: `MANAGER` only
- **Description**: Makes `taskId` depend on `dependsOnId`. Runs Directed Acyclic Graph (DAG) cycle detection.
- **Request Body**:
```json
{
  "taskId": 3,
  "dependsOnId": 2
}
```
- **Error Response on Cycle (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Adding this dependency would create a circular dependency loop"
}
```

### 6.2 Remove Dependency
- **Endpoint**: `DELETE /api/dependencies/{dependencyId}`
- **Access**: `MANAGER` only

---

## 7. Comments & Activities Endpoints

### 7.1 Post Comment
- **Endpoint**: `POST /api/tasks/{taskId}/comments`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "content": "API schema review completed. Integration tests passed with 100% assertions."
}
```

### 7.2 Get Task Activity Stream (Audit Logs)
- **Endpoint**: `GET /api/tasks/{taskId}/activities`
- **Access**: Authenticated
- **Response**: Array of chronological audit events (`STATUS_CHANGED`, `PROGRESS_UPDATED`, etc.) with actor metadata.

---

## 8. Artificial Intelligence Endpoints (`/api/ai`)

### 8.1 Generate Work Breakdown Plan
- **Endpoint**: `POST /api/ai/generate-plan`
- **Access**: `MANAGER` only
- **Request Body**:
```json
{
  "projectId": 1,
  "projectContext": "High-throughput real-time fraud detection engine using Kafka and Spring Boot."
}
```
- **Response**: Structured array of technical tasks, estimated duration, recommended roles, and acceptance criteria.

### 8.2 Analyze Project Risks
- **Endpoint**: `GET /api/ai/risk-analysis/{projectId}`
- **Access**: Authenticated
- **Response**: Project risk score (0–100), bottleneck identification, overdue task flags, and actionable mitigation strategies.

### 8.3 Generate Task Implementation Guide
- **Endpoint**: `GET /api/ai/implementation-plan/{taskId}`
- **Access**: Authenticated
- **Response**: Step-by-step developer roadmap, prerequisites, potential pitfalls, and testing criteria.

---

## 9. Dashboard Analytics (`/api/dashboard`)

### 9.1 Manager Dashboard Metrics
- **Endpoint**: `GET /api/dashboard/manager`
- **Access**: `MANAGER` only
- **Metrics**: Total initiatives, active tasks, blocked tasks, high-risk items, team workload distribution.

### 9.2 Employee Dashboard Metrics
- **Endpoint**: `GET /api/dashboard/employee`
- **Access**: Authenticated
- **Metrics**: My pending tasks, items due this week, overdue count, completion velocity.
