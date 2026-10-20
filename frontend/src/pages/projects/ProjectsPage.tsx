import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FolderKanban, Archive, RotateCcw, Calendar, CheckCircle2 } from 'lucide-react'
import { projectsApi } from '../../api/projects'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { projectStatusConfig } from '../../lib/statusStyles'
import { formatDate } from '../../lib/utils'
import type { Project, ProjectStatus } from '../../types'

export function ProjectsPage() {
  const { isManager } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // New Project Form State
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStatus, setNewStatus] = useState<ProjectStatus>('PLANNING')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [search, statusFilter, page])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await projectsApi.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        size: 10,
      })
      if (res.success && res.data) {
        setProjects(res.data.content)
        setTotalPages(res.data.totalPages)
      }
    } catch (err) {
      console.error('Failed to load projects', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await projectsApi.create({
        name: newName,
        description: newDesc,
        status: newStatus,
        startDate: newStartDate || undefined,
        endDate: newEndDate || undefined,
      })
      if (res.success) {
        setCreateModalOpen(false)
        setNewName('')
        setNewDesc('')
        setNewStartDate('')
        setNewEndDate('')
        fetchProjects()
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleArchive = async (id: number, isArchived: boolean) => {
    try {
      if (isArchived) {
        await projectsApi.restore(id)
      } else {
        await projectsApi.archive(id)
      }
      fetchProjects()
    } catch (err) {
      console.error('Failed to toggle archive status', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your product roadmaps, milestones, and deliverable health.
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            className="input pl-9 py-1.5 text-xs"
            placeholder="Search projects by name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 shrink-0">Status:</span>
          <select
            className="input py-1.5 text-xs w-full sm:w-36"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table / Empty State */}
      {loading ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={search || statusFilter ? 'Try adjusting your search filters.' : 'Create your first project to get started.'}
          action={
            isManager && !search && !statusFilter ? (
              <Button onClick={() => setCreateModalOpen(true)}>Create Project</Button>
            ) : null
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Progress</th>
                <th>Timeline</th>
                <th>Tasks</th>
                {isManager && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projects/${p.id}`} className="font-semibold text-gray-900 hover:text-primary-600 block">
                      {p.name}
                    </Link>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-sm">{p.description}</p>
                    )}
                  </td>
                  <td>
                    <Badge className={projectStatusConfig[p.status]?.className}>
                      {projectStatusConfig[p.status]?.label ?? p.status}
                    </Badge>
                  </td>
                  <td className="text-xs text-gray-600 font-medium">
                    {p.managerName}
                  </td>
                  <td className="w-40">
                    <ProgressBar value={p.progressPercent} showLabel size="sm" />
                  </td>
                  <td className="text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">
                    <span className="font-medium text-gray-900">{p.completedTaskCount}</span>
                    <span className="text-gray-400"> / {p.taskCount}</span>
                  </td>
                  {isManager && (
                    <td className="text-right">
                      <button
                        onClick={() => handleArchive(p.id, p.archived)}
                        title={p.archived ? 'Restore Project' : 'Archive Project'}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      >
                        {p.archived ? <RotateCcw className="w-4 h-4 text-emerald-600" /> : <Archive className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
              <span>Page {page + 1} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              {createError}
            </div>
          )}

          <Input
            label="Project Name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. NextGen Mobile Banking Platform"
            required
            autoFocus
          />

          <div>
            <label className="label">Project Description</label>
            <textarea
              className="input h-20 resize-none text-xs"
              placeholder="Scope, core features, and architectural objectives..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={newStartDate}
              onChange={e => setNewStartDate(e.target.value)}
            />
            <Input
              label="Target End Date"
              type="date"
              value={newEndDate}
              onChange={e => setNewEndDate(e.target.value)}
            />
          </div>

          <Select
            label="Initial Status"
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as ProjectStatus)}
          >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
