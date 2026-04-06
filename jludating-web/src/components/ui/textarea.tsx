import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      className={`flex min-h-[80px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary
        placeholder:text-text-secondary/50
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        disabled:cursor-not-allowed disabled:opacity-50
        resize-none ${className}`}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
