import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function AccessDeniedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div className="card max-w-md w-full p-8 text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
        <p className="text-sm text-gray-600 mt-2">
          You do not have the required permissions to view this resource. Some actions are reserved strictly for Managers.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/dashboard')} variant="primary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
