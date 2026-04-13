import * as React from 'react'

import { cn } from '@/lib/utils'

export function Card({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] border border-stone-200/70 bg-white shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('text-base font-semibold text-stone-900', className)} {...props} />
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm leading-relaxed text-stone-500', className)} {...props} />
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('p-6', className)} {...props} />
}
