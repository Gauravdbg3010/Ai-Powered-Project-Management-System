import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, AlertCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuth } from '../../store/authContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      if (res.success && res.data) {
        login(res.data)
        navigate('/dashboard')
      } else {
        setError(res.message ?? 'Login failed')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      if (!axiosErr.response) {
        setError(axiosErr.message || 'Cannot connect to backend server. Make sure the backend is deployed/running and reachable.')
      } else {
        setError(axiosErr.response.data?.message || 'Invalid email or password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'manager' | 'employee') => {
    if (role === 'manager') {
      setEmail('sarah.chen@taskflow.dev')
      setPassword('Password123!')
    } else {
      setEmail('marcus.vance@taskflow.dev')
      setPassword('Password123!')
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
          <p className="text-sm text-gray-500 mt-1">AI-Powered Project & Task Management</p>
        </div>

        <div className="card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Sign in to your account</h2>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" loading={loading} className="w-full justify-center py-2">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials Quick-Fill:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('manager')}
                className="px-2.5 py-1.5 text-xs text-left bg-surface-subtle hover:bg-primary-50 hover:text-primary-700 border border-border rounded transition-colors"
              >
                <span className="font-semibold block">Engineering Lead</span>
                <span className="text-[11px] text-gray-500 block">sarah.chen@taskflow.dev</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('employee')}
                className="px-2.5 py-1.5 text-xs text-left bg-surface-subtle hover:bg-primary-50 hover:text-primary-700 border border-border rounded transition-colors"
              >
                <span className="font-semibold block">Product Engineer</span>
                <span className="text-[11px] text-gray-500 block">marcus.vance@taskflow.dev</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
