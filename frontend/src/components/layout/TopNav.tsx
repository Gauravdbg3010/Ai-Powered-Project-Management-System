import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../../store/authContext'

const routeLabels: Record<string, string> = {
  dashboard:    'Dashboard',
  projects:     'Projects',
  'my-tasks':   'My Tasks',
  team:         'Workload & Team',
  ai:           'AI Assistant',
  architecture: 'Architecture & System Design',
  settings:     'Settings',
}

export function TopNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] ?? (seg.length > 8 ? `#${seg}` : seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-border shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link to="/dashboard" className="hover:text-gray-900 transition-colors">TaskFlow</Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className={i === crumbs.length - 1 ? 'font-semibold text-gray-900' : 'hover:text-gray-900 transition-colors'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* User info & Status pill */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-800">Live API</span>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
          <p className="text-[11px] text-gray-500">{user?.email}</p>
        </div>
      </div>
    </header>
  )
}
