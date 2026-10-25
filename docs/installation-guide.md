# Local Installation & Developer Setup Guide

> Step-by-step developer installation guide to clone, configure, test, and run **TaskFlow — AI-Powered Project Management System** on your local machine.

---

## 1. Prerequisites

Before getting started, ensure you have the following installed:

| Tool | Minimum Version | Verification Command | Purpose |
|---|---|---|---|
| **Git** | `2.40+` | `git --version` | Source code version control |
| **Java JDK** | `21 (LTS)` | `java -version` | Backend runtime & compiler |
| **Node.js** | `18.x` or `20.x` | `node -v` | Frontend JavaScript runtime |
| **npm** | `9.x+` | `npm -v` | Frontend package manager |
| **Maven** | *(bundled via `mvnw`)* | `.\mvnw.cmd -v` | Backend build automation |

---

## 2. Clone the Repository

```powershell
git clone https://github.com/Gauravdbg3010/Ai-Powered-Project-Management-System.git
cd "Ai-Powered-Project-Management-System"
```

---

## 3. Backend Setup & Launch

The backend comes with an embedded H2 database profile that requires **zero external database installation**.

### Step 3.1: Run Unit & Integration Tests
Verify that all 11 backend tests pass cleanly:
```powershell
cd backend
.\mvnw.cmd test
```
*Expected result*: `Tests run: 11, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS`.

### Step 3.2: Launch Spring Boot Server
Launch with the zero-config in-memory `h2` profile:
```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"
```

The backend server will start on [http://localhost:8080](http://localhost:8080).

### Step 3.3: Verify Backend Endpoints
- **Interactive Swagger Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)  
  *(JDBC URL: `jdbc:h2:mem:taskflow_db`, User: `sa`, Password: blank)*

---

## 4. Frontend Setup & Launch

Open a second terminal window for the React client.

### Step 4.1: Install Dependencies
```powershell
cd frontend
npm install
```

### Step 4.2: Verify Production Build
```powershell
npm run build
```
*Expected result*: `tsc && vite build` completes with 0 errors.

### Step 4.3: Launch Vite Dev Server
```powershell
npm run dev
```

The frontend SPA will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 5. Ready-to-Use Local Test Credentials

The backend automatically seeds realistic engineering demo accounts on startup:

| Role | Name | Email | Password |
|---|---|---|---|
| **Engineering Lead (Manager)** | Sarah Chen | `sarah.chen@taskflow.dev` | `Password123!` |
| **Product Engineer (Employee)** | Marcus Vance | `marcus.vance@taskflow.dev` | `Password123!` |
| **Platform Engineer** | David Miller | `david.miller@taskflow.dev` | `Password123!` |
| **Product Designer** | Elena Rostova | `elena.rostova@taskflow.dev` | `Password123!` |

*(Tip: On the login page, you can also use the single-click Quick-Fill buttons to instantly populate the credentials).*

---

## 6. Optional: Running with Local MySQL 8.0

If you prefer testing with permanent MySQL storage rather than H2 in-memory:
1. Ensure MySQL is running on port 3306.
2. Create the database: `CREATE DATABASE taskflow_db;`.
3. Set your credentials in `backend/src/main/resources/application-mysql.properties`.
4. Run:
   ```powershell
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
   ```
