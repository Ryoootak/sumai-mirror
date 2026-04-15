import Image from 'next/image'

type AppHeaderProps = {
  title: string
  subtitle?: string
  /** 右側に表示するイメージ */
  image?: 'home_sun' | 'home_mirror' | 'none'
  /** 雲の装飾を表示するか */
  showCloud?: boolean
}

export function AppHeader({
  title,
  subtitle,
  image = 'none',
  showCloud = false,
}: AppHeaderProps) {
  return (
    <header className="relative overflow-hidden px-5 pt-10 pb-5">
      {/* グラデーション背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/70 to-transparent pointer-events-none" />

      {/* 雲の装飾 */}
      {showCloud && (
        <Image
          src="/images/cloud.png"
          alt=""
          width={120}
          height={72}
          className="absolute top-3 right-2 opacity-60 pointer-events-none select-none"
          priority
        />
      )}

      <div className="relative flex items-center justify-between">
        {/* タイトル */}
        <div>
          <h1
            className="text-2xl font-bold text-stone-800 leading-none"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-stone-400 mt-1">{subtitle}</p>
          )}
        </div>

        {/* 右側イメージ */}
        {image === 'home_sun' && (
          <Image
            src="/images/home_sun.png"
            alt=""
            width={72}
            height={72}
            className="opacity-90 drop-shadow-sm select-none pointer-events-none"
          />
        )}
        {image === 'home_mirror' && (
          <Image
            src="/images/home_mirror.png"
            alt=""
            width={72}
            height={72}
            className="opacity-90 drop-shadow-sm select-none pointer-events-none"
          />
        )}
      </div>
    </header>
  )
}
