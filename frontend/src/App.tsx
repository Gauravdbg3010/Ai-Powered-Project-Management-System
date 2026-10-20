import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/authContext'
import { AppShell } from './components/layout/AppShell'
import { PrivateRoute } from './router/PrivateRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { MyTasksPage } from './pages/tasks/MyTasksPage'
import { TaskDetailPage } from './pages/tasks/TaskDetailPage'
import { TeamPage } from './pages/team/TeamPage'
import { AiPage } from './pages/ai/AiPage'
import { ArchitecturePage } from './pages/architecture/ArchitecturePage'
import { SettingsPage } from './pages/settings/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Protected Application Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
