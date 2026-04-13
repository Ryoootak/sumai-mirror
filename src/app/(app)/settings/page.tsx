import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { PreferencesForm } from '@/components/settings/PreferencesForm'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profile')
    .select('name, preferences')
    .eq('id', user.id)
    .single()

  return (
    <div className="pb-28">
      <header className="px-5 pt-12 pb-6">
        <h1
          className="text-2xl font-bold text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          設定
        </h1>
      </header>

      <main className="px-5 space-y-6">
        {/* Profile */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">アカウント</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600">
              {profile?.name?.slice(0, 1) ?? user.email?.slice(0, 1) ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-stone-800">{profile?.name ?? '名前未設定'}</p>
              <p className="text-sm text-stone-400">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">希望条件</p>
          <PreferencesForm
            userId={user.id}
            initialPreferences={(profile?.preferences ?? {}) as Record<string, string>}
          />
        </section>

        {/* Logout */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm overflow-hidden">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-5 py-4 text-rose-500 hover:bg-rose-50 transition"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            <span className="font-medium">ログアウト</span>
          </Link>
        </section>
      </main>
    </div>
  )
}
