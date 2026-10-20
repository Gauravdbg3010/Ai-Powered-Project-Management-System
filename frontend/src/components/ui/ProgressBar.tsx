import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number // 0–100
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, className, showLabel = false, size = 'sm' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'
  const color = clamped === 100 ? 'bg-emerald-500' : clamped >= 70 ? 'bg-primary-500' : clamped >= 40 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-100 rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-500 w-8 text-right">{clamped}%</span>}
    </div>
  )
}
