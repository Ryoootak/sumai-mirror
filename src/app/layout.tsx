import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const lineSeedJP = localFont({
  src: [
    { path: './fonts/LINESeedJP_OTF_Rg.woff2', weight: '400', style: 'normal' },
    { path: './fonts/LINESeedJP_OTF_Bd.woff2', weight: '700', style: 'normal' },
    { path: './fonts/LINESeedJP_OTF_Eb.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-line-seed-jp',
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
    <html lang="ja" className={`${geistSans.variable} ${lineSeedJP.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
