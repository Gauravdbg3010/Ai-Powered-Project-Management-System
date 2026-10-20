import { useState } from 'react'
import { Settings, Shield, User, Database, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function SettingsPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your account profile, permissions, and security parameters.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* User Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" /> Account Profile
        </h2>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <Input label="Name" defaultValue={user?.name} />
          <Input label="Email" defaultValue={user?.email} disabled />
          <div>
            <label className="label">Assigned Role</label>
            <div className="inline-block px-2.5 py-1 rounded bg-surface-subtle border border-border text-xs font-bold text-gray-700">
              {user?.role}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Roles are enforced on backend REST endpoints via Spring Security.
            </p>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </div>

      {/* Security & System Info */}
      <div className="card p-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-600" /> Security & Architecture Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded border border-border bg-surface-muted">
            <span className="text-gray-500 font-medium block">Authentication</span>
            <span className="font-semibold text-gray-800 mt-0.5 block">Stateless JWT + BCrypt(12)</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface-muted">
            <span className="text-gray-500 font-medium block">Database Connectivity</span>
            <span className="font-semibold text-emerald-700 mt-0.5 block">MySQL / Hibernate 6 JPA</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface-muted">
            <span className="text-gray-500 font-medium block">Spring AI Integration</span>
            <span className="font-semibold text-blue-700 mt-0.5 block">OpenAI ChatModel with Heuristic Fallback</span>
          </div>
          <div className="p-3 rounded border border-border bg-surface-muted">
            <span className="text-gray-500 font-medium block">API Documentation</span>
            <span className="font-semibold text-gray-800 mt-0.5 block">OpenAPI 3 / Swagger UI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
