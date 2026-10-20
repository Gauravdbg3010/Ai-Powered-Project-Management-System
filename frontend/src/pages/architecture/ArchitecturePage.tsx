import { Layers, Database, Shield, Cpu, ArrowRight, Server, Globe } from 'lucide-react'

export function ArchitecturePage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold text-gray-900">System Architecture & Clean Design</h1>
        <p className="text-xs text-gray-500 mt-1">
          Technical specifications, layer separation, data flow, and security boundaries.
        </p>
      </div>

      {/* Layer Architecture Flow Diagram */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-600" /> End-to-End System Data Flow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>1. Presentation Layer</span>
            </div>
            <p className="text-indigo-800 text-[11px] leading-relaxed">
              React 18 + Vite SPA with TypeScript. Strict design tokens, 8pt spacing grid, Axios HTTP interceptors with Bearer JWT tokens.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>2. Security & Gateway</span>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Spring Security 6 with stateless OncePerRequest JWT filter. Method security with @PreAuthorize. BCrypt(12) password hashing.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Server className="w-4 h-4 text-purple-600" />
              <span>3. Modular Core</span>
            </div>
            <p className="text-purple-800 text-[11px] leading-relaxed">
              Controller → Service → Repository cleanly separated. DFS circular dependency detection engine and transactional boundaries.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>4. AI Engine & DB</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Spring AI with ChatModel + heuristic fallbacks. MySQL relational database with foreign key constraints and JPA auditing.
            </p>
          </div>
        </div>
      </div>

      {/* Database Entity Relationship Diagram */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary-600" /> Database Entity Relationship Diagram (ERD)
        </h2>

        <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
{`+----------------+        1 : N         +-------------------+
|     USERS      |<-------------------->|     PROJECTS      |
|----------------|                      |-------------------|
| id (PK)        |                      | id (PK)           |
| name           |                      | name              |
| email (UNIQUE) |                      | description       |
| password_hash  |                      | status            |
| role           |                      | manager_id (FK)   |
+----------------+                      +-------------------+
        ^                                         ^
        | 1 : N (Assignee)                        | 1 : N
        v                                         v
+----------------+        1 : N         +-------------------+
| TASK_COMMENTS  |<-------------------->|       TASKS       |
|----------------|                      |-------------------|
| id (PK)        |                      | id (PK)           |
| task_id (FK)   |                      | title             |
| author_id (FK) |                      | priority, status  |
| content        |                      | progress (0-100)  |
+----------------+                      | project_id (FK)   |
        ^                               | assignee_id (FK)  |
        |                               +-------------------+
+----------------+                                ^  ^
| TASK_ACTIVITY  |                                |  | N : M (DFS Verified)
|----------------|                                v  v
| id (PK)        |                      +-------------------+
| task_id (FK)   |                      | TASK_DEPENDENCIES |
| actor_id (FK)  |                      |-------------------|
| action         |                      | id (PK)           |
| old/new_value  |                      | task_id (FK)      |
+----------------+                      | depends_on_id(FK) |
                                        +-------------------+`}
        </div>
      </div>

      {/* Layer Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Controller-Service-Repository Pattern</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>
              <strong className="text-gray-900">Controllers:</strong> Handle HTTP protocols, status codes, OpenAPI documentation, and request validation (@Valid).
            </li>
            <li>
              <strong className="text-gray-900">Services:</strong> Enforce business invariants, calculate risk scores, execute DFS cycle detection, and handle @Transactional rollbacks.
            </li>
            <li>
              <strong className="text-gray-900">Repositories:</strong> Spring Data JPA interfaces with JPQL queries, pagination (Pageable), and index-optimized filters.
            </li>
            <li>
              <strong className="text-gray-900">DTOs:</strong> Strictly separate internal JPA entity graphs from exposed API schemas to prevent password/hash leakage.
            </li>
          </ul>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Spring AI Architecture & Security</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>
              <strong className="text-gray-900">Context Pre-Authorization:</strong> The backend queries and validates authorized projects and tasks before passing context to LLM.
            </li>
            <li>
              <strong className="text-gray-900">Structured Output:</strong> JSON Schema constraints ensure AI plans and implementation roadmaps parse cleanly into Java DTOs.
            </li>
            <li>
              <strong className="text-gray-900">Human-In-The-Loop Approval:</strong> AI suggestions are never auto-committed; managers review, edit, approve, or reject.
            </li>
            <li>
              <strong className="text-gray-900">Deterministic Fallbacks:</strong> Graceful degradation ensures zero application downtime if LLM API keys are unconfigured.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
