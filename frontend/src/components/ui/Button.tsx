import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const base = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      ghost:     'btn-ghost',
      danger:    'btn-danger',
    }[variant]

    const sz = size === 'sm' ? 'px-2 py-1 text-xs' : ''

    return (
      <button
        ref={ref}
        className={cn(base, sz, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
