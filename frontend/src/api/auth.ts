import client from './client'
import type { ApiResponse, AuthUser, LoginRequest, RegisterRequest } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<AuthUser>>('/auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    client.post<ApiResponse<AuthUser>>('/auth/register', data).then(r => r.data),

  me: () =>
    client.get<ApiResponse<AuthUser>>('/auth/me').then(r => r.data),
}
