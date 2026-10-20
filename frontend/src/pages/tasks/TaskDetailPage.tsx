import { useState, useEffect, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock, Calendar, User as UserIcon,
  Sparkles, MessageSquare, Activity as ActivityIcon, Link as LinkIcon,
  Trash2, Plus, AlertCircle
} from 'lucide-react'
import { tasksApi } from '../../api/tasks'
import { aiApi } from '../../api/ai'
import { usersApi } from '../../api/users'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { taskStatusConfig, taskPriorityConfig } from '../../lib/statusStyles'
import { formatDate, formatRelativeTime } from '../../lib/utils'
import type { Task, Comment, Activity, User, TaskStatus, TaskPriority, ImplementationPlan } from '../../types'

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const { user, isManager } = useAuth()
  const tId = Number(taskId)

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [dependencies, setDependencies] = useState<number[]>([])
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Status & Progress update states
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>('TODO')
  const [currentProgress, setCurrentProgress] = useState(0)

  // New Comment state
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  // Add Dependency Modal
  const [depModalOpen, setDepModalOpen] = useState(false)
  const [selectedDepId, setSelectedDepId] = useState<number | null>(null)
  const [depError, setDepError] = useState('')

  // AI Implementation Plan Modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiPlan, setAiPlan] = useState<ImplementationPlan | null>(null)
  const [loadingAiPlan, setLoadingAiPlan] = useState(false)

  useEffect(() => {
    loadAll()
  }, [tId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [taskRes, comRes, actRes, depRes] = await Promise.all([
        tasksApi.get(tId),
        tasksApi.getComments(tId),
        tasksApi.getActivities(tId),
        tasksApi.getDependencies(tId),
      ])

      if (taskRes.success) {
        setTask(taskRes.data)
        setCurrentStatus(taskRes.data.status)
        setCurrentProgress(taskRes.data.progress)

        // Load project sibling tasks for dependency selection
        tasksApi.listByProject(taskRes.data.projectId, { size: 100 }).then(res => {
          if (res.success) setProjectTasks(res.data.content)
        })
      }

      if (comRes.success) setComments(res => comRes.data)
      if (actRes.success) setActivities(res => actRes.data)
      if (depRes.success) setDependencies(res => depRes.data)

      if (isManager) {
        usersApi.employees().then(res => {
          if (res.success) setEmployees(res.data)
        })
      }
    } catch (err) {
      console.error('Failed to load task details', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      const res = await tasksApi.updateStatus(tId, newStatus)
      if (res.success) {
        setCurrentStatus(newStatus)
        setTask(res.data)
        // Refresh activity
        tasksApi.getActivities(tId).then(r => r.success && setActivities(r.data))
      }
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleProgressChange = async (newProgress: number) => {
    try {
      const res = await tasksApi.updateProgress(tId, newProgress)
      if (res.success) {
        setCurrentProgress(newProgress)
        setTask(res.data)
      }
    } catch (err) {
      console.error('Failed to update progress', err)
    }
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setPostingComment(true)
    try {
      const res = await tasksApi.addComment(tId, commentText.trim())
      if (res.success) {
        setComments(prev => [res.data, ...prev])
        setCommentText('')
      }
    } catch (err) {
      console.error('Failed to post comment', err)
    } finally {
      setPostingComment(false)
    }
  }

  const handleAddDependency = async () => {
    if (!selectedDepId) return
    setDepError('')
    try {
      await tasksApi.addDependency(tId, selectedDepId)
      setDepModalOpen(false)
      setSelectedDepId(null)
      tasksApi.getDependencies(tId).then(r => r.success && setDependencies(r.data))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDepError(msg ?? 'Failed to add dependency (may create circular cycle).')
    }
  }

  const handleRemoveDependency = async (depId: number) => {
    try {
      await tasksApi.removeDependency(tId, depId)
      setDependencies(prev => prev.filter(id => id !== depId))
    } catch (err) {
      console.error('Failed to remove dependency', err)
    }
  }

  const handleOpenAiPlan = async () => {
    setAiModalOpen(true)
    if (!aiPlan) {
      setLoadingAiPlan(true)
      try {
        const res = await aiApi.getImplementationPlan(tId)
        if (res.success) setAiPlan(res.data)
      } catch (err) {
        console.error('Failed to fetch implementation plan', err)
      } finally {
        setLoadingAiPlan(false)
      }
    }
  }

  if (loading || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        to={`/projects/${task.projectId}`}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Project ({task.projectName})
      </Link>

      {/* Main Task Card */}
      <div className="card p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">TASK-{task.id}</span>
              <Badge className={taskPriorityConfig[task.priority]?.className}>
                {task.priority} Priority
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-xs text-gray-500">
              Project:{' '}
              <Link to={`/projects/${task.projectId}`} className="font-semibold text-primary-600 hover:underline">
                {task.projectName}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenAiPlan}
              className="gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Implementation Plan</span>
            </Button>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description & Scope</h2>
          <div className="p-4 rounded-lg bg-surface-muted border border-border text-xs text-gray-800 leading-relaxed whitespace-pre-line font-mono">
            {task.description || 'No detailed description provided.'}
          </div>
        </div>

        {/* Task Attributes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-subtle border border-border">
          {/* Status Dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">Status</label>
            <select
              className="input py-1 text-xs font-semibold"
              value={currentStatus}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Progress</label>
              <span className="text-xs font-bold text-gray-900">{currentProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="w-full accent-primary-600 cursor-pointer"
              value={currentProgress}
              onChange={e => setCurrentProgress(Number(e.target.value))}
              onMouseUp={() => handleProgressChange(currentProgress)}
              onTouchEnd={() => handleProgressChange(currentProgress)}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">Assignee</label>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 pt-1">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              {task.assigneeName ? task.assigneeName : <span className="text-gray-400 italic">Unassigned</span>}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">Due Date</label>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 pt-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {formatDate(task.dueDate)}
            </div>
          </div>
        </div>

        {/* Task Dependencies Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Task Dependencies</h2>
            </div>
            {isManager && (
              <Button onClick={() => { setDepError(''); setDepModalOpen(true); }} variant="secondary" size="sm" className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Prerequisite
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {dependencies.length > 0 ? (
              dependencies.map(depId => {
                const depTask = projectTasks.find(t => t.id === depId)
                return (
                  <div key={depId} className="flex items-center justify-between p-2.5 rounded border border-border bg-white text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary-600">TASK-{depId}</span>
                      <span className="font-medium text-gray-800">{depTask?.title ?? 'Prerequisite Task'}</span>
                      {depTask && (
                        <Badge className={taskStatusConfig[depTask.status]?.className}>
                          {depTask.status}
                        </Badge>
                      )}
                    </div>
                    {isManager && (
                      <button
                        onClick={() => handleRemoveDependency(depId)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove Dependency"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-gray-400 py-2">No prerequisites defined. This task can be started immediately.</p>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Comments & Activity Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          {/* Comments Thread */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" /> Comments & Discussion ({comments.length})
            </h2>

            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea
                className="input h-18 resize-none text-xs"
                placeholder="Write a comment or status update..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={postingComment} disabled={!commentText.trim()}>
                  Post Comment
                </Button>
              </div>
            </form>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="p-3 rounded-lg border border-border bg-surface-muted/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{c.authorName}</span>
                    <span className="text-[11px] text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Trail */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-gray-500" /> Audit Trail ({activities.length})
            </h2>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded border border-border/60 bg-white text-xs">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{a.actorName}</span>
                      <span className="text-[10px] text-gray-400">{formatRelativeTime(a.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      <span className="font-medium text-gray-800">{a.action}</span>
                      {a.newValue && <span className="text-gray-500"> → {a.newValue}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Dependency Modal */}
      <Modal
        open={depModalOpen}
        onClose={() => setDepModalOpen(false)}
        title="Add Prerequisite Dependency"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select a task that must be completed before <span className="font-semibold text-gray-800">TASK-{task.id}</span> can begin.
            The backend DFS engine prevents circular dependencies.
          </p>

          {depError && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{depError}</span>
            </div>
          )}

          <select
            className="input text-xs"
            value={selectedDepId ?? ''}
            onChange={e => setSelectedDepId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select prerequisite task...</option>
            {projectTasks
              .filter(pt => pt.id !== task.id && !dependencies.includes(pt.id))
              .map(pt => (
                <option key={pt.id} value={pt.id}>
                  TASK-{pt.id}: {pt.title} ({pt.status})
                </option>
              ))}
          </select>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setDepModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDependency} disabled={!selectedDepId}>
              Add Dependency
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Implementation Plan Modal */}
      <Modal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Task Implementation Plan"
        size="lg"
      >
        {loadingAiPlan ? (
          <Spinner />
        ) : aiPlan ? (
          <div className="space-y-5 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Target Task</span>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5">{aiPlan.taskTitle}</h3>
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                Prerequisites & Setup
              </h4>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                {aiPlan.prerequisites.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Subtasks */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                Step-by-Step Implementation Subtasks
              </h4>
              <div className="space-y-1.5">
                {aiPlan.stepByStepSubtasks.map((step, i) => (
                  <div key={i} className="p-2.5 rounded bg-surface-muted border border-border text-gray-800 font-medium">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Completion Criteria */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                Definition of Done / Completion Criteria
              </h4>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                {aiPlan.completionCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Technical Considerations */}
            {aiPlan.technicalConsiderations && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                <span className="font-bold block mb-0.5">Architectural & Edge-Case Considerations:</span>
                {aiPlan.technicalConsiderations}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setAiModalOpen(false)}>
                Close Plan
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-6 text-center">Unable to load AI plan.</p>
        )}
      </Modal>
    </div>
  )
}
