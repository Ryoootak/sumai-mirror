import { NextRequest, NextResponse } from 'next/server'
import type { OgpData } from '@/types'

export const runtime = 'edge'

// Extract a meta tag content by property or name
function getMeta(html: string, attr: string, value: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

// Naive price extraction from title/description (Japanese property sites)
function extractPrice(text: string): string | null {
  const m = text.match(/[\d,]+\s*万円/)
  return m ? m[0] : null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Only allow http/https
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'invalid protocol' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SumaiMirror/1.0)',
        Accept: 'text/html',
      },
      // Edge fetch supports signal for timeout via AbortController
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `fetch failed: ${res.status}` }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'not an HTML page' }, { status: 422 })
    }

    // Read only the first 100KB to keep it fast
    const reader = res.body?.getReader()
    if (!reader) throw new Error('no body')
    const chunks: Uint8Array[] = []
    let total = 0
    while (total < 100_000) {
      const { done, value } = await reader.read()
      if (done || !value) break
      chunks.push(value)
      total += value.byteLength
    }
    reader.cancel()

    const html = new TextDecoder('utf-8', { fatal: false }).decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length)
        merged.set(acc)
        merged.set(c, acc.length)
        return merged
      }, new Uint8Array(0))
    )

    const ogTitle = getMeta(html, 'property', 'og:title')
    const twitterTitle = getMeta(html, 'name', 'twitter:title')
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const rawTitle = ogTitle ?? twitterTitle ?? titleMatch?.[1]?.trim() ?? null

    const ogDesc = getMeta(html, 'property', 'og:description')
    const metaDesc = getMeta(html, 'name', 'description')
    const description = ogDesc ?? metaDesc ?? null

    const ogImage = getMeta(html, 'property', 'og:image')

    const priceSource = [rawTitle, description].filter(Boolean).join(' ')
    const price = extractPrice(priceSource)

    const data: OgpData = {
      title: rawTitle,
      description,
      image: ogImage,
      price,
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
