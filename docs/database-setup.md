# Database Setup & Configuration Guide

> Persistence architecture and database setup guide for **TaskFlow — AI-Powered Project Management System**.  
> Covers local development with H2 in-memory database and production deployment with MySQL 8.0.

---

## 1. Dual-Profile Persistence Architecture

TaskFlow uses Spring Boot profiles to support two distinct database environments:

| Environment | Spring Profile | Database | Persistence Strategy |
|---|---|---|---|
| **Local Development & Demo** | `h2` | H2 In-Memory | Transient; auto-seeded with realistic production sample data on each startup. |
| **Production Deployment** | `mysql` | MySQL 8.0 / Managed DB | Permanent ACID persistence with connection pooling. |

---

## 2. Option A: H2 In-Memory Setup (Zero-Config / Default)

The `h2` profile requires zero external installation. It runs completely inside JVM memory and starts instantly.

### Configuration (`application-h2.properties`)
```properties
spring.datasource.url=jdbc:h2:mem:taskflow_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

### Running with H2 Profile
```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"
```

### Accessing H2 Web Console
When the backend is running under the `h2` profile, you can inspect tables directly in your browser:
1. Open [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
2. Enter connection details:
   - **JDBC URL**: `jdbc:h2:mem:taskflow_db`
   - **User Name**: `sa`
   - **Password**: *(leave blank)*
3. Click **Connect** to query tables (`USERS`, `PROJECTS`, `TASKS`, `TASK_DEPENDENCIES`, etc.).

---

## 3. Option B: MySQL 8.0 Production Setup

For permanent data storage across restarts, use MySQL 8.0.

### 3.1 Install & Create Database
Log in to your MySQL terminal and run:
```sql
-- 1. Create taskflow database
CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create dedicated application user
CREATE USER 'taskflow_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON taskflow_db.* TO 'taskflow_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 Configuration (`application-mysql.properties`)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/taskflow_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=taskflow_user
spring.datasource.password=StrongPassword123!
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# HikariCP Connection Pool Settings
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.connection-timeout=20000
```

### 3.3 Running with MySQL Profile
```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Or via environment variables in production:
```bash
SPRING_PROFILES_ACTIVE=mysql
SPRING_DATASOURCE_URL=jdbc:mysql://<host>:<port>/taskflow_db
SPRING_DATASOURCE_USERNAME=<db_user>
SPRING_DATASOURCE_PASSWORD=<db_password>
```

---

## 4. Entity Auditing & Lifecycle Hooks

All core entities extend a common auditing configuration:
- `@EnableJpaAuditing`: Automatically records creation and last-modified timestamps.
- `@CreationTimestamp`: Automatically populates `created_at` on record insert.
- `@UpdateTimestamp`: Automatically updates `updated_at` whenever any column is modified.

---

## 5. Seed Data & Initialization

When the application starts up, [`DataInitializer.java`](file:///d:/Project%201/backend/src/main/java/com/taskflow/config/DataInitializer.java) runs automatically (`CommandLineRunner`). If the database has 0 users, it seeds:
- 4 Realistic Engineering Team profiles:
  - Engineering Lead (`sarah.chen@taskflow.dev` / `Password123!`)
  - Product Engineer (`marcus.vance@taskflow.dev` / `Password123!`)
  - Platform Engineer (`david.miller@taskflow.dev`)
  - Product Designer (`elena.rostova@taskflow.dev`)
- 3 Realistic Enterprise initiatives (Mobile Banking, Cloud Migration, AI Sentiment Engine).
- Granular deliverables with statuses, priorities, DAG dependencies, comments, and audit activities.
