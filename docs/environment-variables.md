# Environment Variables Reference

> Comprehensive reference of all environment variables for **TaskFlow — AI-Powered Project Management System**.  
> Covers configuration for both the Spring Boot backend and the React frontend.

---

## 1. Backend Environment Variables (`backend/`)

The backend reads configuration from system environment variables with fallback defaults defined in `application.properties`, `application-h2.properties`, and `application-mysql.properties`.

### Core Application & Server

| Variable | Required? | Default Value | Description |
|---|:---:|---|---|
| `PORT` | No | `8080` | The HTTP port on which the embedded Tomcat server listens. Managed automatically by Render. |
| `SPRING_PROFILES_ACTIVE` | No | `h2` | Active Spring profile: `h2` (in-memory demo) or `mysql` (production database). |

---

### Security & JWT Configuration

| Variable | Required? | Default Value | Description |
|---|:---:|---|---|
| `TASKFLOW_JWT_SECRET` | **Yes (Prod)** | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit or 512-bit HMAC secret key used to sign and verify JWT authentication tokens. Must be kept secret. |
| `TASKFLOW_JWT_EXPIRATION` | No | `86400000` | Token validity duration in milliseconds. Defaults to 24 hours (86,400,000 ms). |

---

### Database Configuration (MySQL Profile)

These variables are required only when `SPRING_PROFILES_ACTIVE=mysql`:

| Variable | Required? | Default Value | Description |
|---|:---:|---|---|
| `SPRING_DATASOURCE_URL` | Yes (MySQL) | `jdbc:mysql://localhost:3306/taskflow_db` | JDBC connection URL including host, port, database name, and SSL parameters. |
| `SPRING_DATASOURCE_USERNAME` | Yes (MySQL) | `taskflow_user` | Database user account name. |
| `SPRING_DATASOURCE_PASSWORD` | Yes (MySQL) | *(none)* | Password for the database user account. |

---

### Artificial Intelligence Configuration (Spring AI)

TaskFlow includes a deterministic heuristic fallback engine. If neither API key is provided, the application continues to operate without errors.

| Variable | Required? | Default Value | Description |
|---|:---:|---|---|
| `SPRING_AI_GEMINI_API_KEY` | Optional | *(none)* | Google Gemini API key used by Spring AI for generating task breakdowns, risk assessments, and implementation plans. |
| `SPRING_AI_OPENAI_API_KEY` | Optional | *(none)* | OpenAI API key (alternative provider support). |

---

## 2. Frontend Environment Variables (`frontend/`)

Frontend variables must be prefixed with `VITE_` so that Vite exposes them to client code via `import.meta.env`.

| Variable | Required? | Production Value | Local Development Value | Description |
|---|:---:|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | `https://ai-powered-project-management-system-2e5f.onrender.com/api` | `http://localhost:8080/api` | Base URL of the backend REST API. In production, points to the Render domain. |

> [!WARNING]
> Never commit real production secrets, API keys, or database passwords into git repository files. On Vercel and Render, configure them exclusively through their respective cloud dashboard **Environment Variables** tabs.

---

## 3. Local Development Template (`.env.example`)

### Backend (`backend/.env.example`)
```env
PORT=8080
SPRING_PROFILES_ACTIVE=h2
TASKFLOW_JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
TASKFLOW_JWT_EXPIRATION=86400000
SPRING_AI_GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`frontend/.env.example`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```
