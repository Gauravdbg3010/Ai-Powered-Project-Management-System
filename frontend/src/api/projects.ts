import client from './client'
import type { ApiResponse, PageResponse, Project, CreateProjectRequest } from '../types'

export const projectsApi = {
  list: (params?: { search?: string; status?: string; page?: number; size?: number }) =>
    client.get<ApiResponse<PageResponse<Project>>>('/projects', { params }).then(r => r.data),

  get: (id: number) =>
    client.get<ApiResponse<Project>>(`/projects/${id}`).then(r => r.data),

  create: (data: CreateProjectRequest) =>
    client.post<ApiResponse<Project>>('/projects', data).then(r => r.data),

  update: (id: number, data: Partial<CreateProjectRequest>) =>
    client.put<ApiResponse<Project>>(`/projects/${id}`, data).then(r => r.data),

  archive: (id: number) =>
    client.patch<ApiResponse<void>>(`/projects/${id}/archive`).then(r => r.data),

  restore: (id: number) =>
    client.patch<ApiResponse<void>>(`/projects/${id}/restore`).then(r => r.data),
}
