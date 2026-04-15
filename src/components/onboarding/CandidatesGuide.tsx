'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

const FIRST_STEP_KEY = 'sumai-mirror:candidates-guide:first'
const MIRROR_STEP_KEY = 'sumai-mirror:candidates-guide:mirror'

export function CandidatesGuide({ logCount }: { logCount: number }) {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const step = useMemo(() => {
    if (!mounted) return null
    if (logCount === 0) {
      return localStorage.getItem(FIRST_STEP_KEY) ? null : 'first'
    }
    return localStorage.getItem(MIRROR_STEP_KEY) ? null : 'mirror'
  }, [logCount, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setDismissed(false)
  }, [step])

  if (!step || dismissed) return null

  const close = () => {
    const key = step === 'first' ? FIRST_STEP_KEY : MIRROR_STEP_KEY
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(180deg,#fffaf3_0%,#fff 100%)] p-5 shadow-sm">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
          Start here
        </div>

        {step === 'first' ? (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                まずはここから
              </h2>
              <p className="text-sm leading-7 text-stone-600">
                最初は1件だけで大丈夫です。URLを入れると、物件名などを自動で取り込みます。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/log/new" onClick={close}>
                <Button className="h-11 rounded-2xl bg-amber-500 px-5 text-white shadow-sm hover:bg-amber-600">
                  <Sparkles className="size-4 animate-pulse" />
                  最初の物件候補を追加する
                </Button>
              </Link>
              <button type="button" onClick={close} className="text-sm font-medium text-stone-500 transition hover:text-stone-700">
                あとで見る
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                1件入ったので、もう鏡が使えます
              </h2>
              <p className="text-sm leading-7 text-stone-600">
                鏡では、今ある候補の見え方をすぐ確認できます。候補が5件たまるとAIによる好みの分析も始まります。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/mirror" onClick={close}>
                <Button className="h-11 rounded-2xl bg-stone-900 px-5 text-white shadow-sm hover:bg-stone-800">
                  鏡を開く
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <button type="button" onClick={close} className="text-sm font-medium text-stone-500 transition hover:text-stone-700">
                この案内を閉じる
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
