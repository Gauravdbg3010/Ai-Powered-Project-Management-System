import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, CheckCircle2, Clock, Briefcase, Mail, Shield, UserCheck } from 'lucide-react'
import { usersApi } from '../../api/users'
import { dashboardApi } from '../../api/dashboard'
import { useAuth } from '../../store/authContext'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import type { User, ManagerDashboard } from '../../types'

export function TeamPage() {
  const { isManager, user } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const [dashboard, setDashboard] = useState<ManagerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    setLoading(true)
    try {
      if (isManager) {
        const [usersRes, dashRes] = await Promise.all([
          usersApi.all(),
          dashboardApi.manager(),
        ])
        if (usersRes.success) setMembers(usersRes.data)
        if (dashRes.success) setDashboard(dashRes.data)
      } else {
        // For employee, show current user team context
        setMembers([{ id: user?.userId || 1, name: user?.name || 'You', email: user?.email || '', role: 'EMPLOYEE' }])
      }
    } catch (err) {
      console.error('Failed to load team', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = async (targetUser: User) => {
    const nextRole = targetUser.role === 'MANAGER' ? 'EMPLOYEE' : 'MANAGER'
    setUpdatingId(targetUser.id)
    try {
      const res = await usersApi.updateRole(targetUser.id, nextRole)
      if (res.success) {
        setMembers(prev =>
          prev.map(m => (m.id === targetUser.id ? { ...m, role: nextRole } : m))
        )
        setSuccessMsg(`${targetUser.name} is now appointed as ${nextRole === 'MANAGER' ? 'Manager' : 'Employee'}!`)
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Failed to update role', err)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Team & Workload Distribution</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Monitor team allocation, assignments, and manage roles across your workspace.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Team Members</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{members.length}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Registered workspace users</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Total Deliverables</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{dashboard?.totalTasks ?? 0}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Across active initiatives</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Completed Tasks</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{dashboard?.completedTasks ?? 0}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Successfully delivered</p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" /> Workspace Members & Roles
          </h2>
          {isManager && (
            <span className="text-xs text-gray-400">
              Managers can appoint members as Managers or Employees
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(emp => {
            const isSelf = emp.id === user?.userId
            const isManagerRole = emp.role === 'MANAGER'

            return (
              <div
                key={emp.id}
                className="p-4 rounded-lg border border-border bg-surface-muted/30 hover:bg-white hover:shadow-card transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isManagerRole
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-gray-900 truncate">{emp.name}</h3>
                      {isSelf && (
                        <span className="text-[10px] text-gray-400 font-normal">(You)</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" /> {emp.email}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {isManagerRole ? (
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Manager
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        Employee
                      </Badge>
                    )}
                  </div>

                  {isManager && !isSelf && (
                    <button
                      type="button"
                      disabled={updatingId === emp.id}
                      onClick={() => handleRoleToggle(emp)}
                      className="text-[11px] font-medium text-primary-600 hover:text-primary-800 hover:underline transition-colors disabled:opacity-50"
                    >
                      {updatingId === emp.id
                        ? 'Updating...'
                        : isManagerRole
                        ? 'Set as Employee'
                        : 'Appoint Manager'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
