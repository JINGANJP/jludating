import * as React from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <select
      value={value ?? ''}
      onChange={e => onValueChange?.(e.target.value)}
      className={`flex h-10 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-text-primary
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em' }}
    >
      {children}
    </select>
  )
}

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
)

export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({ children, className = '', ...props }) => (
  <option className={className} {...props}>{children}</option>
)

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
)

export const SelectValue: React.FC<React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }> = ({ placeholder, children, ...props }) => (
  <span className="text-text-secondary" {...props}>{children || placeholder}</span>
)
