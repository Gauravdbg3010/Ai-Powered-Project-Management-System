import client from './client'
import type { ApiResponse, PageResponse, Task, CreateTaskRequest, Comment, Activity, TaskStatus } from '../types'

export const tasksApi = {
  listByProject: (projectId: number, params?: { page?: number; size?: number }) =>
    client.get<ApiResponse<PageResponse<Task>>>(`/projects/${projectId}/tasks`, { params }).then(r => r.data),

  get: (id: number) =>
    client.get<ApiResponse<Task>>(`/tasks/${id}`).then(r => r.data),

  myTasks: () =>
    client.get<ApiResponse<Task[]>>('/tasks/my').then(r => r.data),

  create: (projectId: number, data: CreateTaskRequest) =>
    client.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data).then(r => r.data),

  update: (id: number, data: Partial<CreateTaskRequest>) =>
    client.put<ApiResponse<Task>>(`/tasks/${id}`, data).then(r => r.data),

  updateStatus: (id: number, status: TaskStatus) =>
    client.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status }).then(r => r.data),

  updateProgress: (id: number, progress: number) =>
    client.patch<ApiResponse<Task>>(`/tasks/${id}/progress`, { progress }).then(r => r.data),

  delete: (id: number) =>
    client.delete<ApiResponse<void>>(`/tasks/${id}`).then(r => r.data),

  getComments: (taskId: number) =>
    client.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`).then(r => r.data),

  addComment: (taskId: number, content: string) =>
    client.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content }).then(r => r.data),

  getActivities: (taskId: number) =>
    client.get<ApiResponse<Activity[]>>(`/tasks/${taskId}/activities`).then(r => r.data),

  getProjectActivities: (projectId: number) =>
    client.get<ApiResponse<Activity[]>>(`/projects/${projectId}/activities`).then(r => r.data),

  getDependencies: (taskId: number) =>
    client.get<ApiResponse<number[]>>(`/tasks/${taskId}/dependencies`).then(r => r.data),

  addDependency: (taskId: number, dependsOnId: number) =>
    client.post<ApiResponse<void>>(`/tasks/${taskId}/dependencies/${dependsOnId}`).then(r => r.data),

  removeDependency: (taskId: number, dependsOnId: number) =>
    client.delete<ApiResponse<void>>(`/tasks/${taskId}/dependencies/${dependsOnId}`).then(r => r.data),
}
