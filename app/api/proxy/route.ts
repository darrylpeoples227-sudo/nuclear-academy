import { NextRequest } from 'next/server'

const BLOCKED_HEADERS = new Set(['content-security-policy', 'x-frame-options', 'content-encoding', 'content-length'])

function absoluteUrl(value: string, base: string) {
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function proxyUrl(value: string, base: string) {
  const absolute = absoluteUrl(value, base)
  return absolute ? `/api/proxy?url=${encodeURIComponent(absolute)}` : value
}

function rewriteHtml(html: string, sourceUrl: string) {
  return html
    .replace(/\b(href|src|action)=(['"])([^'"#]+)\2/gi, (_, attribute, quote, value) => {
      return `${attribute}=${quote}${proxyUrl(value, sourceUrl)}${quote}`
    })
    .replace(/url\((['"]?)([^)'"\s]+)\1\)/gi, (_, quote, value) => {
      return `url(${quote}${proxyUrl(value, sourceUrl)}${quote})`
    })
    .replace(/<base\b[^>]*>/gi, '')
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) return new Response('Missing url', { status: 400 })

  let target: URL
  try {
    target = new URL(rawUrl)
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Unsupported protocol')
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  try {
    const upstream = await fetch(target, {
      headers: { 'user-agent': 'Mozilla/5.0 Nuclear Academy Browser' },
      redirect: 'follow',
    })
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const headers = new Headers()
    headers.set('content-type', contentType)
    headers.set('cache-control', 'no-store')

    for (const [key, value] of upstream.headers.entries()) {
      if (!BLOCKED_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== 'content-type') headers.set(key, value)
    }

    if (contentType.includes('text/html')) {
      const html = rewriteHtml(await upstream.text(), upstream.url || target.toString())
      return new Response(html, { status: upstream.status, headers })
    }

    return new Response(upstream.body, { status: upstream.status, headers })
  } catch {
    return new Response('Unable to load this page through the browser proxy.', { status: 502 })
  }
}
