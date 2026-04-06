import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => (
    <input
      type={type}
      className={`flex h-10 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-text-primary
        placeholder:text-text-secondary/50
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}`}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'
