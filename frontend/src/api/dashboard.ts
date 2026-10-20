import client from './client'
import type { ApiResponse, ManagerDashboard, EmployeeDashboard } from '../types'

export const dashboardApi = {
  manager: () =>
    client.get<ApiResponse<ManagerDashboard>>('/dashboard/manager').then(r => r.data),

  employee: () =>
    client.get<ApiResponse<EmployeeDashboard>>('/dashboard/employee').then(r => r.data),
}
