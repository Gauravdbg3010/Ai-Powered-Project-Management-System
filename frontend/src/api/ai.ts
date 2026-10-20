import client from './client'
import type { ApiResponse, AiTask, RiskAnalysis, ImplementationPlan, Task } from '../types'

export interface TaskPlanRequest {
  projectDescription: string
  objectives: string
  techStack: string
  deadline: string
  teamContext: string
}

export interface ApproveTaskPlanRequest {
  tasks: AiTask[]
}

export interface ChatRequest {
  message: string
  projectId?: number
}

export interface ChatResponse {
  response: string
  contextSummary: string
}

export interface AiConfig {
  apiKey?: string
  provider?: string
  model?: string
  configured: boolean
}

export const aiApi = {
  getConfig: () =>
    client.get<ApiResponse<AiConfig>>('/ai/config').then(r => r.data),

  updateConfig: (data: { apiKey: string; provider?: string; model?: string }) =>
    client.post<ApiResponse<AiConfig>>('/ai/config', data).then(r => r.data),

  generateTaskPlan: (projectId: number, data: TaskPlanRequest) =>
    client.post<ApiResponse<AiTask[]>>(`/ai/projects/${projectId}/task-plan`, data).then(r => r.data),

  approveTaskPlan: (projectId: number, data: ApproveTaskPlanRequest) =>
    client.post<ApiResponse<Task[]>>(`/ai/projects/${projectId}/task-plan/approve`, data).then(r => r.data),

  getRiskAnalysis: (projectId: number) =>
    client.get<ApiResponse<RiskAnalysis>>(`/ai/projects/${projectId}/risk`).then(r => r.data),

  getProjectSummary: (projectId: number) =>
    client.get<ApiResponse<string>>(`/ai/projects/${projectId}/summary`).then(r => r.data),

  chat: (data: ChatRequest) =>
    client.post<ApiResponse<ChatResponse>>('/ai/assistant/chat', data).then(r => r.data),

  getImplementationPlan: (taskId: number) =>
    client.get<ApiResponse<ImplementationPlan>>(`/ai/tasks/${taskId}/implementation-plan`).then(r => r.data),
}
