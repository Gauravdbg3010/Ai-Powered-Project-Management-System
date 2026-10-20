import client from './client'
import type { ApiResponse, User } from '../types'

export const usersApi = {
  employees: () =>
    client.get<ApiResponse<User[]>>('/users/employees').then(r => r.data),
  all: () =>
    client.get<ApiResponse<User[]>>('/users').then(r => r.data),
  updateRole: (userId: number, role: 'MANAGER' | 'EMPLOYEE') =>
    client.patch<ApiResponse<User>>(`/users/${userId}/role`, { role }).then(r => r.data),
}
