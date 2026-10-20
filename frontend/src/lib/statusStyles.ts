import type { TaskStatus, TaskPriority, ProjectStatus } from '../types'

export const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO:        { label: 'To Do',       className: 'bg-gray-100 text-gray-700 border-gray-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_REVIEW:   { label: 'In Review',   className: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED:   { label: 'Completed',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  BLOCKED:     { label: 'Blocked',     className: 'bg-red-50 text-red-700 border-red-200' },
}

export const taskPriorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW:      { label: 'Low',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
  MEDIUM:   { label: 'Medium',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH:     { label: 'High',    className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CRITICAL: { label: 'Critical',className: 'bg-red-50 text-red-700 border-red-200' },
}

export const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  PLANNING:  { label: 'Planning',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACTIVE:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ON_HOLD:   { label: 'On Hold',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200' },
}
