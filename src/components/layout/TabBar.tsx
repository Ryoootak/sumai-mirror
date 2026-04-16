'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL_TABS = [
  { href: '/log',      label: '候補',  Icon: Home,     pairOnly: false },
  { href: '/mirror',   label: '分析',  Icon: Sparkles, pairOnly: false },
  { href: '/pair',     label: 'ペア',  Icon: Users,    pairOnly: true  },
  { href: '/settings', label: '設定',  Icon: Settings, pairOnly: false },
] as const

export function TabBar({ isSolo = false }: { isSolo?: boolean }) {
  const pathname = usePathname()
  const tabs = isSolo ? ALL_TABS.filter(t => !t.pairOnly) : ALL_TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/60 bg-white/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-3 py-3">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-5 py-2 transition-all',
                active ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              )}
            >
              <Icon
                className={cn('size-5', active && 'fill-amber-100')}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className={cn('text-[10px] font-medium', active ? 'text-amber-700' : 'text-stone-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
