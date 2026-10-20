// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: number
  email: string
  name: string
  role: 'MANAGER' | 'EMPLOYEE'
  token?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: 'MANAGER' | 'EMPLOYEE'
}

// ─── API wrapper ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string>
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ─── Projects ────────────────────────────────────────────────────────────────
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  managerId: number
  managerName: string
  archived: boolean
  taskCount: number
  completedTaskCount: number
  progressPercent: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  progress: number
  dueDate: string | null
  projectId: number
  projectName: string
  assigneeId: number | null
  assigneeName: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  progress?: number
  dueDate?: string
  assigneeId?: number | null
}

// ─── Comments ────────────────────────────────────────────────────────────────
export interface Comment {
  id: number
  taskId: number
  authorId: number
  authorName: string
  content: string
  createdAt: string
}

// ─── Activity ────────────────────────────────────────────────────────────────
export interface Activity {
  id: number
  taskId: number
  taskTitle: string
  actorId: number
  actorName: string
  action: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface ManagerDashboard {
  activeProjects: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  blockedTasks: number
  projectSummaries: ProjectSummary[]
  upcomingDeadlines: UpcomingDeadline[]
  recentActivities: RecentActivity[]
}

export interface ProjectSummary {
  id: number
  name: string
  status: string
  progressPercent: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  highRisk: boolean
}

export interface UpcomingDeadline {
  taskId: number
  taskTitle: string
  projectId: number
  projectName: string
  dueDate: string
  priority: TaskPriority
}

export interface RecentActivity {
  taskId: number
  taskTitle: string
  actorName: string
  action: string
  oldValue: string | null
  newValue: string | null
  timestamp: string
}

export interface EmployeeDashboard {
  totalAssigned: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
  blockedTasks: number
  tasksByStatus: Record<string, number>
  dueSoonTasks: TaskSummaryItem[]
  overdueSummary: TaskSummaryItem[]
}

export interface TaskSummaryItem {
  id: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectName: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export interface AiTask {
  title: string
  description: string
  priority: string
  estimatedDuration: string
  suggestedRole: string
  dependencies: string[]
  acceptanceCriteria: string
  selected?: boolean
}

export interface RiskFactor {
  factor: string
  severity: string
  evidence: string
}

export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number
  overdueTasksCount: number
  blockedTasksCount: number
  criticalTasksCount: number
  unresolvedDependencyTasksCount: number
  daysUntilProjectDeadline: number | null
  factors: RiskFactor[]
  recommendations: string[]
  explanation: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  contextSummary?: string
}

export interface ImplementationPlan {
  taskId: number
  taskTitle: string
  prerequisites: string[]
  stepByStepSubtasks: string[]
  completionCriteria: string[]
  technicalConsiderations: string
}

export interface User {
  id: number
  name: string
  email: string
  role?: 'MANAGER' | 'EMPLOYEE'
}
