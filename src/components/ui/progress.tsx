import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

export function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  value?: number
}) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-stone-100',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-amber-500 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
