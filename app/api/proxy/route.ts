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
      const sourceUrl = upstream.url || target.toString()
      const body = await upstream.text()
      if (!upstream.ok) {
        const safeTitle = upstream.status === 403 ? 'This site blocked the request' : `This site returned ${upstream.status}`
        const safeMessage = upstream.status === 403 ? 'The destination denied the browser proxy request. Try another link or open the original site directly.' : 'The destination could not provide a page through the browser proxy.'
        const errorHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif;background:#071208;color:#efffec}body{display:grid;place-items:center;padding:24px;box-sizing:border-box}.card{width:min(540px,100%);padding:36px;border:1px solid #315b35;border-radius:22px;background:#102313;box-shadow:0 24px 80px #0008}.eyebrow{color:#79e66a;font-size:11px;font-weight:800;letter-spacing:.14em}.card h1{margin:10px 0;font-size:30px}.card p{color:#a9c1aa;line-height:1.6}.url{overflow:hidden;color:#79e66a;text-overflow:ellipsis;white-space:nowrap}</style></head><body><main class="card"><div class="eyebrow">NUCLEAR ACADEMY BROWSER</div><h1>${safeTitle}</h1><p>${safeMessage}</p><p class="url">${sourceUrl}</p></main></body></html>`
        headers.set('content-type', 'text/html; charset=utf-8')
        return new Response(errorHtml, { status: 200, headers })
      }
      return new Response(rewriteHtml(body, sourceUrl), { status: 200, headers })
    }

    return new Response(upstream.body, { status: upstream.ok ? 200 : upstream.status, headers })
  } catch {
    return new Response('Unable to load this page through the browser proxy.', { status: 502 })
  }
}
