import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/50 bg-background p-6 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
