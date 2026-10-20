gitimport { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, AlertCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({ name, email, password, role })
      if (res.success && res.data) {
        login(res.data)
        navigate('/dashboard')
      } else {
        setError(res.message ?? 'Registration failed')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Registration failed. Email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl shadow-md mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">TaskFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Join your team workspace</p>
        </div>

        <div className="card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Create an account</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Create your profile and choose your workspace role.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Sarah Connor"
              required
              autoFocus
            />

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Workspace Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('EMPLOYEE')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    role === 'EMPLOYEE'
                      ? 'border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-600'
                      : 'border-border bg-white text-gray-700 hover:bg-surface-muted'
                  }`}
                >
                  <span className="block font-semibold">Employee</span>
                  <span className="block text-[10px] text-gray-500 mt-0.5">Tasks & Deliverables</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MANAGER')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    role === 'MANAGER'
                      ? 'border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-600'
                      : 'border-border bg-white text-gray-700 hover:bg-surface-muted'
                  }`}
                >
                  <span className="block font-semibold">Manager</span>
                  <span className="block text-[10px] text-gray-500 mt-0.5">Projects, Team & AI</span>
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-2">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
