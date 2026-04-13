import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const zenKakuGothic = localFont({
  src: [
    { path: './fonts/ZenKakuGothicNew-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/ZenKakuGothicNew-500.ttf', weight: '500', style: 'normal' },
    { path: './fonts/ZenKakuGothicNew-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-zen-kaku',
  display: 'swap',
})

const manrope = localFont({
  src: [
    { path: './fonts/Manrope-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Manrope-700.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Manrope-800.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SUMAI MIRROR',
  description: '家探しの「好み」を言語化するアプリ',
}

export const viewport: Viewport = {
  themeColor: '#FAFAF8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${zenKakuGothic.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
