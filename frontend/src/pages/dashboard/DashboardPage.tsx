import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  ArrowUpRight, Activity, Calendar, Sparkles
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { dashboardApi } from '../../api/dashboard'
import { useAuth } from '../../store/authContext'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { taskStatusConfig, taskPriorityConfig } from '../../lib/statusStyles'
import { formatDate, formatRelativeTime } from '../../lib/utils'
import type { ManagerDashboard, EmployeeDashboard } from '../../types'

export function DashboardPage() {
  const { user, isManager } = useAuth()
  const [managerData, setManagerData] = useState<ManagerDashboard | null>(null)
  const [employeeData, setEmployeeData] = useState<EmployeeDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [isManager])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isManager) {
        const res = await dashboardApi.manager()
        if (res.success) setManagerData(res.data)
      } else {
        const res = await dashboardApi.employee()
        if (res.success) setEmployeeData(res.data)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to load dashboard data from backend')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner />
        <p className="text-xs text-gray-500 mt-2">Loading workspace analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 border-red-200 bg-red-50 text-red-800">
        <h3 className="font-semibold text-sm">Dashboard Error</h3>
        <p className="text-xs mt-1">{error}</p>
        <button onClick={loadDashboard} className="btn-secondary mt-4 text-xs">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isManager
              ? 'Real-time overview of team projects, risk indicators, and active deliverables.'
              : 'Here is your daily task schedule and immediate priorities.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <Link to="/projects" className="btn-primary text-xs">
              <FolderKanban className="w-3.5 h-3.5 mr-1" />
              Manage Projects
            </Link>
          )}
          <Link to="/my-tasks" className="btn-secondary text-xs">
            My Tasks
          </Link>
        </div>
      </div>

      {isManager ? (
        <ManagerView data={managerData} />
      ) : (
        <EmployeeView data={employeeData} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function ManagerView({ data }: { data: ManagerDashboard | null }) {
  if (!data) return null

  const chartData = (data.projectSummaries || []).map(p => ({
    name: p.name.length > 14 ? p.name.substring(0, 14) + '...' : p.name,
    progress: p.progressPercent,
    tasks: p.totalTasks,
    highRisk: p.highRisk,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.activeProjects}</div>
          <p className="text-[11px] text-gray-400 mt-1">Under your management</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.totalTasks}</div>
          <p className="text-[11px] text-gray-400 mt-1">{data.completedTasks} completed</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Completion Rate</span>
            <span className="text-xs font-semibold text-emerald-600">
              {data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.completedTasks}</div>
          <p className="text-[11px] text-gray-400 mt-1">Finished tasks</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{data.overdueTasks}</div>
          <p className="text-[11px] text-gray-400 mt-1">Needs deadline adjustment</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Blocked Tasks</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{data.blockedTasks}</div>
          <p className="text-[11px] text-gray-400 mt-1">Requires intervention</p>
        </div>
      </div>

      {/* Main Grid: Projects Status + Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Summaries Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Project Health & Progress</h2>
              <p className="text-xs text-gray-500">Live breakdown calculated from database records</p>
            </div>
            <Link to="/projects" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Progress</th>
                  <th>Tasks</th>
                  <th>Overdue</th>
                  <th>Risk Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.projectSummaries && data.projectSummaries.length > 0 ? (
                  data.projectSummaries.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium text-gray-900">
                        <Link to={`/projects/${p.id}`} className="hover:text-primary-600 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="w-44">
                        <ProgressBar value={p.progressPercent} showLabel size="sm" />
                      </td>
                      <td className="text-xs text-gray-500">
                        {p.completedTasks}/{p.totalTasks}
                      </td>
                      <td className="text-xs">
                        {p.overdueTasks > 0 ? (
                          <span className="text-amber-600 font-semibold">{p.overdueTasks}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td>
                        {p.highRisk ? (
                          <Badge className="bg-red-50 text-red-700 border-red-200 gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            High Risk
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Healthy
                          </Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/projects/${p.id}?tab=ai`}
                          className="text-xs font-medium text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Insights
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                      No active projects found. Create one from the Projects page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Project Progress Distribution</h2>
            <p className="text-xs text-gray-500 mb-4">Actual % completion across current initiatives</p>
            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      formatter={(val: number) => [`${val}% completed`, 'Progress']}
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    />
                    <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.highRisk ? '#ef4444' : entry.progress >= 70 ? '#4f46e5' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400">No chart data available</div>
            )}
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
            <span>Red bars indicate high-risk project velocity</span>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Upcoming Deadlines & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Upcoming Task Deadlines (Next 7 Days)
            </h2>
            <span className="text-xs text-gray-400">{data.upcomingDeadlines?.length || 0} scheduled</span>
          </div>

          <div className="space-y-2.5">
            {data.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border bg-surface-muted/30 hover:bg-surface-subtle transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <Link to={`/tasks/${item.taskId}`} className="text-xs font-semibold text-gray-900 hover:text-primary-600 truncate block">
                      {item.taskTitle}
                    </Link>
                    <span className="text-[11px] text-gray-500">{item.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={taskPriorityConfig[item.priority]?.className ?? 'bg-gray-100 text-gray-700'}>
                      {item.priority}
                    </Badge>
                    <span className="text-xs font-medium text-gray-600">
                      {formatDate(item.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No approaching deadlines in the next 7 days.</p>
            )}
          </div>
        </div>

        {/* Recent Task Activity Audit */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              Recent Task Activity
            </h2>
            <span className="text-xs text-gray-400">Live audit trail</span>
          </div>

          <div className="space-y-3">
            {data.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs pb-2.5 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{act.actorName}</span>
                      <span className="text-[11px] text-gray-400">{formatRelativeTime(act.timestamp)}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      <span className="font-medium text-gray-800">{act.action}</span> on{' '}
                      <Link to={`/tasks/${act.taskId}`} className="text-primary-600 hover:underline">
                        "{act.taskTitle}"
                      </Link>
                      {act.newValue && <span className="text-gray-500"> → {act.newValue}</span>}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No recent activities logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeView({ data }: { data: EmployeeDashboard | null }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Assigned to Me</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.totalAssigned}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Active responsibilities</p>
        </div>

        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">In Progress</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data.inProgressTasks}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Work underway</p>
        </div>

        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.completedTasks}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Delivered tasks</p>
        </div>

        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Due Soon</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{data.dueSoonTasks?.length || 0}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Next 7 days</p>
        </div>

        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Overdue</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{data.overdueTasks}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Needs immediate focus</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Soon Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Tasks Due Soon</h2>
            <Link to="/my-tasks" className="text-xs font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {data.dueSoonTasks && data.dueSoonTasks.length > 0 ? (
              data.dueSoonTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded border border-border bg-surface-muted/30">
                  <div>
                    <Link to={`/tasks/${t.id}`} className="text-xs font-semibold text-gray-900 hover:text-primary-600 block">
                      {t.title}
                    </Link>
                    <span className="text-[11px] text-gray-500">{t.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={taskStatusConfig[t.status]?.className}>
                      {taskStatusConfig[t.status]?.label}
                    </Badge>
                    <span className="text-xs text-gray-600 font-medium">{formatDate(t.dueDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No tasks due soon. You are up to date!</p>
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 text-red-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Overdue Tasks
            </h2>
            <span className="text-xs text-gray-500">{data.overdueSummary?.length || 0} overdue</span>
          </div>

          <div className="space-y-2.5">
            {data.overdueSummary && data.overdueSummary.length > 0 ? (
              data.overdueSummary.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded border border-red-200 bg-red-50/40">
                  <div>
                    <Link to={`/tasks/${t.id}`} className="text-xs font-semibold text-gray-900 hover:text-primary-600 block">
                      {t.title}
                    </Link>
                    <span className="text-[11px] text-gray-500">{t.projectName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={taskPriorityConfig[t.priority]?.className}>
                      {t.priority}
                    </Badge>
                    <span className="text-xs text-red-700 font-semibold">{formatDate(t.dueDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">Zero overdue tasks! Great job maintaining momentum.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
