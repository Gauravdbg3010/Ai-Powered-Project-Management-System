import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
