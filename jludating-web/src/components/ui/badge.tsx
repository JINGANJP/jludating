import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

const variantClasses = {
  default: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground border-secondary/30',
  outline: 'border border-border text-text-primary bg-transparent',
  destructive: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors
      ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
)
