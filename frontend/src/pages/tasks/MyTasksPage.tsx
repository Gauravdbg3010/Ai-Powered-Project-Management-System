import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, Filter, ArrowUpRight } from 'lucide-react'
import { tasksApi } from '../../api/tasks'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { taskStatusConfig, taskPriorityConfig } from '../../lib/statusStyles'
import { formatDate, isOverdue } from '../../lib/utils'
import type { Task, TaskStatus } from '../../types'

export function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    loadMyTasks()
  }, [])

  const loadMyTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksApi.myTasks()
      if (res.success) setTasks(res.data)
    } catch (err) {
      console.error('Failed to load my tasks', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const res = await tasksApi.updateStatus(taskId, newStatus)
      if (res.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? res.data : t))
      }
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const filteredTasks = statusFilter === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Tasks assigned directly to you across all projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter Status:</span>
          <select
            className="input py-1 text-xs w-36"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All ({tasks.length})</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="You currently have no tasks assigned to your profile."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th className="text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.map(t => {
                const overdue = isOverdue(t.dueDate, t.status)
                return (
                  <tr key={t.id} className={overdue ? 'bg-red-50/20' : ''}>
                    <td>
                      <Link to={`/tasks/${t.id}`} className="font-semibold text-gray-900 hover:text-primary-600 block">
                        {t.title}
                      </Link>
                      {t.description && (
                        <span className="text-xs text-gray-400 line-clamp-1 max-w-sm">{t.description}</span>
                      )}
                    </td>
                    <td className="text-xs text-gray-600">
                      <Link to={`/projects/${t.projectId}`} className="hover:underline font-medium">
                        {t.projectName}
                      </Link>
                    </td>
                    <td>
                      <Badge className={taskStatusConfig[t.status]?.className}>
                        {taskStatusConfig[t.status]?.label ?? t.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={taskPriorityConfig[t.priority]?.className}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="w-32">
                      <ProgressBar value={t.progress} showLabel size="sm" />
                    </td>
                    <td className="text-xs">
                      {overdue ? (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(t.dueDate)}
                        </span>
                      ) : (
                        <span className="text-gray-600">{formatDate(t.dueDate)}</span>
                      )}
                    </td>
                    <td className="text-right">
                      {t.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleQuickStatus(t.id, 'COMPLETED')}
                          className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                        >
                          Complete
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatus(t.id, 'IN_PROGRESS')}
                          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
