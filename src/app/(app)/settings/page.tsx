import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Settings2 } from 'lucide-react'
import { PreferencesForm } from '@/components/settings/PreferencesForm'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { Card, CardContent } from '@/components/ui/card'

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
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="relative p-6">
            <Image
              src="/images/setting.png"
              alt=""
              width={80}
              height={80}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-90 select-none pointer-events-none drop-shadow-sm"
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
              <Settings2 className="size-3.5 text-amber-500" />
              Profile settings
            </div>
            <h1
              className="mt-4 text-[2rem] font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              設定
            </h1>
          </CardContent>
        </Card>
      </header>

      <main className="px-5 space-y-6">
        {/* Profile */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">アカウント</p>
          <ProfileForm
            userId={user.id}
            initialName={profile?.name ?? ''}
            currentEmail={user.email ?? ''}
          />
        </section>

        {/* Preferences */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">希望条件</p>
          <PreferencesForm
            userId={user.id}
            initialPreferences={(profile?.preferences ?? {}) as Record<string, string>}
          />
        </section>

        {/* Logout / Delete */}
        <section className="rounded-3xl bg-white border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-100">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-5 py-4 text-rose-500 hover:bg-rose-50 transition"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            <span className="font-medium">ログアウト</span>
          </Link>
          <DeleteAccountButton email={user.email ?? ''} />
        </section>
      </main>
    </div>
  )
}
