import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 btn-press',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-card hover:bg-primary-dark hover:shadow-card-hover',
        secondary: 'border border-border bg-surface text-text-primary hover:border-primary/40 hover:text-primary hover:shadow-card',
        ghost: 'text-text-secondary hover:bg-accent-warm hover:text-primary',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
      },
      size: {
        sm: 'h-9 px-4 rounded-lg',
        md: 'h-11 px-5',
        lg: 'h-13 px-7 text-base rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
