import { useState, useEffect, FormEvent } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  FolderKanban, Plus, Sparkles, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, Calendar, ArrowLeft, Send, Check
} from 'lucide-react'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import { aiApi } from '../../api/ai'
import { usersApi } from '../../api/users'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { projectStatusConfig, taskStatusConfig, taskPriorityConfig } from '../../lib/statusStyles'
import { formatDate, formatRelativeTime } from '../../lib/utils'
import type {
  Project, Task, Activity, User, TaskStatus, TaskPriority,
  AiTask, RiskAnalysis
} from '../../types'

type ActiveTab = 'overview' | 'tasks' | 'activity' | 'ai'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const { isManager } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (searchParams.get('tab') as ActiveTab) || 'tasks'
  )

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // New Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState<number | null>(null)
  const [savingTask, setSavingTask] = useState(false)

  // AI Insights State
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiApproving, setAiApproving] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<AiTask[]>([])
  const [aiObjectives, setAiObjectives] = useState('Build complete MVP with secure API and responsive UI')
  const [aiTechStack, setAiTechStack] = useState('Java 21, Spring Boot 3, React, Tailwind CSS, MySQL')
  const [aiDeadline, setAiDeadline] = useState('End of next month')
  const [aiTeamContext, setAiTeamContext] = useState('2 Backend Engineers, 2 Frontend Engineers, 1 QA')
  const [riskData, setRiskData] = useState<RiskAnalysis | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [summaryText, setSummaryText] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [aiSuccessMsg, setAiSuccessMsg] = useState('')

  const pId = Number(projectId)

  useEffect(() => {
    loadAll()
  }, [pId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [projRes, tasksRes, actRes] = await Promise.all([
        projectsApi.get(pId),
        tasksApi.listByProject(pId, { size: 100 }),
        tasksApi.getProjectActivities(pId),
      ])

      if (projRes.success) setProject(projRes.data)
      if (tasksRes.success) setTasks(tasksRes.data.content)
      if (actRes.success) setActivities(actRes.data)

      if (isManager) {
        usersApi.employees().then(res => {
          if (res.success) setEmployees(res.data)
        }).catch(() => {})
      }
    } catch (err) {
      console.error('Failed to load project details', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault()
    setSavingTask(true)
    try {
      const res = await tasksApi.create(pId, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        assigneeId: taskAssigneeId ?? undefined,
      })
      if (res.success) {
        setTaskModalOpen(false)
        setTaskTitle('')
        setTaskDesc('')
        setTaskDueDate('')
        setTaskAssigneeId(null)
        loadAll()
      }
    } catch (err) {
      console.error('Failed to create task', err)
    } finally {
      setSavingTask(false)
    }
  }

  const handleGenerateAiPlan = async () => {
    setAiGenerating(true)
    setAiSuccessMsg('')
    try {
      const res = await aiApi.generateTaskPlan(pId, {
        projectDescription: project?.description || project?.name || 'Project task plan',
        objectives: aiObjectives,
        techStack: aiTechStack,
        deadline: aiDeadline,
        teamContext: aiTeamContext,
      })
      if (res.success) {
        setGeneratedTasks(res.data.map(t => ({ ...t, selected: true })))
      }
    } catch (err) {
      console.error('AI plan generation error', err)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleApproveAiPlan = async () => {
    const selectedOnly = generatedTasks.filter(t => t.selected)
    if (selectedOnly.length === 0) return

    setAiApproving(true)
    try {
      const res = await aiApi.approveTaskPlan(pId, { tasks: selectedOnly })
      if (res.success) {
        setAiSuccessMsg(`Successfully created ${res.data.length} task(s) into database!`)
        setGeneratedTasks([])
        loadAll()
      }
    } catch (err) {
      console.error('Failed to approve AI tasks', err)
    } finally {
      setAiApproving(false)
    }
  }

  const handleLoadRisk = async () => {
    setRiskLoading(true)
    try {
      const res = await aiApi.getRiskAnalysis(pId)
      if (res.success) setRiskData(res.data)
    } catch (err) {
      console.error('Failed to load risk analysis', err)
    } finally {
      setRiskLoading(false)
    }
  }

  const handleLoadSummary = async () => {
    setSummaryLoading(true)
    try {
      const res = await aiApi.getProjectSummary(pId)
      if (res.success) setSummaryText(res.data)
    } catch (err) {
      console.error('Failed to generate summary', err)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <Badge className={projectStatusConfig[project.status]?.className}>
                {projectStatusConfig[project.status]?.label ?? project.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Managed by <span className="font-semibold text-gray-700">{project.managerName}</span> • Timeline:{' '}
              {formatDate(project.startDate)} to {formatDate(project.endDate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <Button onClick={() => setTaskModalOpen(true)} className="gap-1.5 text-xs">
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => { setActiveTab('ai'); handleLoadRisk(); }}
              className="gap-1.5 text-xs text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100"
            >
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>AI Insights</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-semibold">Overall Completion</span>
          <div className="mt-1">
            <ProgressBar value={project.progressPercent} showLabel size="md" />
          </div>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-semibold">Tasks Completed</span>
          <div className="text-base font-bold text-gray-900 mt-0.5">
            {project.completedTaskCount} <span className="text-xs font-normal text-gray-500">/ {project.taskCount} tasks</span>
          </div>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-semibold">Active In-Progress</span>
          <div className="text-base font-bold text-blue-600 mt-0.5">
            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-semibold">Blocked Items</span>
          <div className="text-base font-bold text-red-600 mt-0.5">
            {tasks.filter(t => t.status === 'BLOCKED').length}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium">
        {(['tasks', 'overview', 'activity', 'ai'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'ai' && !riskData) handleLoadRisk()
            }}
            className={`pb-3 capitalize transition-colors relative flex items-center gap-1.5 ${
              activeTab === tab
                ? 'text-primary-600 font-semibold border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab === 'ai' && <Sparkles className="w-3.5 h-3.5 text-primary-500" />}
            {tab === 'ai' ? 'AI Insights' : tab}
            {tab === 'tasks' && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full ml-1">{tasks.length}</span>}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Progress</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.length > 0 ? (
                  tasks.map(t => (
                    <tr key={t.id}>
                      <td className="max-w-xs">
                        <Link to={`/tasks/${t.id}`} className="font-semibold text-gray-900 hover:text-primary-600 block">
                          {t.title}
                        </Link>
                        {t.description && (
                          <span className="text-xs text-gray-400 line-clamp-1">{t.description}</span>
                        )}
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
                      <td className="text-xs text-gray-700">
                        {t.assigneeName ? (
                          <span className="font-medium">{t.assigneeName}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="w-32">
                        <ProgressBar value={t.progress} showLabel size="sm" />
                      </td>
                      <td className="text-xs text-gray-600">
                        {formatDate(t.dueDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                      No tasks yet. Use "Add Task" or switch to "AI Insights" to generate a plan!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Project Description & Objectives</h2>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Project Metadata</h2>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-gray-400">Project ID</dt>
                <dd className="font-semibold text-gray-800">#{project.id}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Project Lead</dt>
                <dd className="font-semibold text-gray-800">{project.managerName}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Start Date</dt>
                <dd className="font-medium text-gray-800">{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Target Delivery</dt>
                <dd className="font-medium text-gray-800">{formatDate(project.endDate)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Project Activity Trail</h2>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map(a => (
                <div key={a.id} className="flex items-start gap-3 text-xs pb-3 border-b border-border/60 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{a.actorName}</span>
                      <span className="text-[11px] text-gray-400">{formatRelativeTime(a.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      <span className="font-medium text-gray-800">{a.action}</span> on task{' '}
                      <Link to={`/tasks/${a.taskId}`} className="text-primary-600 hover:underline">
                        "{a.taskTitle}"
                      </Link>
                      {a.newValue && <span className="text-gray-500"> → {a.newValue}</span>}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">No activity history recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI INSIGHTS */}
      {activeTab === 'ai' && (
        <div className="space-y-8">
          {/* AI Task Plan Generator */}
          {isManager && (
            <div className="card p-6 border-primary-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">AI Task Plan Generator</h2>
                    <p className="text-xs text-gray-500">Break project scope into reviewable, actionable task specifications</p>
                  </div>
                </div>
              </div>

              {aiSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Core Objectives"
                  value={aiObjectives}
                  onChange={e => setAiObjectives(e.target.value)}
                  placeholder="e.g. Build authentication, task dependency engine, and dashboard"
                />
                <Input
                  label="Target Tech Stack"
                  value={aiTechStack}
                  onChange={e => setAiTechStack(e.target.value)}
                  placeholder="e.g. Spring Boot 3, MySQL, React, TypeScript"
                />
                <Input
                  label="Milestone Deadline"
                  value={aiDeadline}
                  onChange={e => setAiDeadline(e.target.value)}
                  placeholder="e.g. 3 weeks from kickoff"
                />
                <Input
                  label="Team Context"
                  value={aiTeamContext}
                  onChange={e => setAiTeamContext(e.target.value)}
                  placeholder="e.g. 2 backend, 2 frontend, 1 QA engineer"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGenerateAiPlan} loading={aiGenerating} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Task Plan</span>
                </Button>
              </div>

              {/* Reviewable Generated Tasks Table */}
              {generatedTasks.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Generated Suggestions ({generatedTasks.length} tasks)
                      </h3>
                      <p className="text-xs text-gray-500">
                        Review, modify or deselect tasks before final approval.
                      </p>
                    </div>
                    <Button onClick={handleApproveAiPlan} loading={aiApproving} variant="primary" className="gap-1.5 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Save Selected ({generatedTasks.filter(t => t.selected).length})</span>
                    </Button>
                  </div>

                  <div className="table-wrapper border">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="w-8">
                            <input
                              type="checkbox"
                              checked={generatedTasks.every(t => t.selected)}
                              onChange={e => {
                                const checked = e.target.checked
                                setGeneratedTasks(prev => prev.map(t => ({ ...t, selected: checked })))
                              }}
                            />
                          </th>
                          <th>Task Title & Scope</th>
                          <th>Role</th>
                          <th>Priority</th>
                          <th>Est. Duration</th>
                          <th>Acceptance Criteria</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {generatedTasks.map((task, idx) => (
                          <tr key={idx} className={task.selected ? 'bg-white' : 'bg-gray-50 opacity-60'}>
                            <td>
                              <input
                                type="checkbox"
                                checked={task.selected}
                                onChange={e => {
                                  const checked = e.target.checked
                                  setGeneratedTasks(prev => prev.map((t, i) => i === idx ? { ...t, selected: checked } : t))
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input py-1 text-xs font-semibold"
                                value={task.title}
                                onChange={e => {
                                  const val = e.target.value
                                  setGeneratedTasks(prev => prev.map((t, i) => i === idx ? { ...t, title: val } : t))
                                }}
                              />
                              <textarea
                                className="input mt-1 text-[11px] h-12 resize-none"
                                value={task.description}
                                onChange={e => {
                                  const val = e.target.value
                                  setGeneratedTasks(prev => prev.map((t, i) => i === idx ? { ...t, description: val } : t))
                                }}
                              />
                            </td>
                            <td className="text-xs text-gray-600 font-medium">
                              {task.suggestedRole}
                            </td>
                            <td>
                              <Badge className={taskPriorityConfig[task.priority as TaskPriority]?.className ?? 'bg-gray-100 text-gray-700'}>
                                {task.priority}
                              </Badge>
                            </td>
                            <td className="text-xs text-gray-600">
                              {task.estimatedDuration}
                            </td>
                            <td className="text-[11px] text-gray-500 max-w-xs">
                              {task.acceptanceCriteria}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Project Risk Analysis */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">AI Project Risk Analysis</h2>
                  <p className="text-xs text-gray-500">Transparent backend rules & LLM evidence synthesis</p>
                </div>
              </div>
              <Button onClick={handleLoadRisk} variant="secondary" size="sm" loading={riskLoading}>
                Re-calculate Risk
              </Button>
            </div>

            {riskData ? (
              <div className="space-y-6">
                {/* Score & Factors Banner */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 rounded-lg bg-surface-muted border border-border">
                  <div className="text-center md:text-left">
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">Risk Level</span>
                    <div className="mt-1">
                      <Badge className={
                        riskData.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300 text-sm py-1 px-3' :
                        riskData.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300 text-sm py-1 px-3' :
                        riskData.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300 text-sm py-1 px-3' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300 text-sm py-1 px-3'
                      }>
                        {riskData.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">Risk Score (0-100)</span>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">{riskData.riskScore}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">Overdue Tasks</span>
                    <div className="text-xl font-bold text-amber-600 mt-0.5">{riskData.overdueTasksCount}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase font-semibold">Blocked Items</span>
                    <div className="text-xl font-bold text-red-600 mt-0.5">{riskData.blockedTasksCount}</div>
                  </div>
                </div>

                {/* Explanation */}
                {riskData.explanation && (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded text-xs text-blue-900 leading-relaxed">
                    <span className="font-semibold block mb-0.5">Synthesis:</span>
                    {riskData.explanation}
                  </div>
                )}

                {/* Risk Factors Table */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Evidence & Factors Detected
                  </h3>
                  <div className="space-y-2">
                    {riskData.factors && riskData.factors.length > 0 ? (
                      riskData.factors.map((f, i) => (
                        <div key={i} className="flex items-start justify-between p-2.5 rounded border border-border bg-white text-xs">
                          <div>
                            <span className="font-semibold text-gray-900">{f.factor}</span>
                            <p className="text-gray-500 text-[11px] mt-0.5">{f.evidence}</p>
                          </div>
                          <Badge className={
                            f.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                            f.severity === 'HIGH' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-700'
                          }>
                            {f.severity}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded border border-emerald-200">
                        Zero risk factors identified. Timeline, dependencies, and velocity are healthy.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {riskData.recommendations && riskData.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Strategic Recommendations
                    </h3>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {riskData.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={handleLoadRisk} variant="secondary" size="sm" loading={riskLoading}>
                Analyze Risk Factors
              </Button>
            )}
          </div>

          {/* AI Progress Summary */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">AI Progress Summary</h2>
                  <p className="text-xs text-gray-500">Separates verified project records from AI strategic recommendations</p>
                </div>
              </div>
              <Button onClick={handleLoadSummary} variant="secondary" size="sm" loading={summaryLoading}>
                Generate Summary
              </Button>
            </div>

            {summaryText ? (
              <div className="p-4 bg-surface-muted rounded border border-border text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                {summaryText}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">
                Click "Generate Summary" to produce an executive status update.
              </p>
            )}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Add Task to Project"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title *"
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            placeholder="e.g. Implement JWT Refresh Token Logic"
            required
            autoFocus
          />

          <div>
            <label className="label">Task Description</label>
            <textarea
              className="input h-20 resize-none text-xs"
              placeholder="Technical specifications and acceptance criteria..."
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={taskPriority}
              onChange={e => setTaskPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            <Input
              label="Due Date"
              type="date"
              value={taskDueDate}
              onChange={e => setTaskDueDate(e.target.value)}
            />
          </div>

          <Select
            label="Assignee"
            value={taskAssigneeId ?? ''}
            onChange={e => setTaskAssigneeId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Unassigned</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingTask}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
