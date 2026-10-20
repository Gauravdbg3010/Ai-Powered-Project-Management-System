import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  Sparkles, Network, Settings, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '../../store/authContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/projects',     label: 'Projects',     icon: FolderKanban },
  { to: '/my-tasks',     label: 'My Tasks',     icon: CheckSquare },
  { to: '/team',         label: 'Workload',     icon: Users },
  { to: '/ai',           label: 'AI Assistant', icon: Sparkles },
  { to: '/architecture', label: 'Architecture', icon: Network },
  { to: '/settings',     label: 'Settings',     icon: Settings },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-border shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg shadow-sm">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-gray-900 block leading-tight">TaskFlow</span>
          <span className="text-[11px] font-medium text-gray-400 block uppercase tracking-wider">Enterprise AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border bg-surface-muted/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white border border-border shadow-sm mb-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-md shrink-0">
            <span className="text-xs font-bold text-primary-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
            <span className={cn(
              'inline-block px-1.5 py-0.2 rounded text-[10px] font-medium uppercase',
              user?.role === 'MANAGER' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'
            )}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
