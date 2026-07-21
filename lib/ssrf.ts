import dns from 'dns'

// Shared SSRF protection for any server-side fetch of a customer-provided
// URL (website scraper, homepage-link check, etc). Single source of truth —
// don't duplicate this logic per route.

const MAX_REDIRECTS = 3

function isPrivateIP(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [, a, b, c] = v4.map(Number)
    if (a === 127) return true                          // 127.0.0.0/8 loopback
    if (a === 0) return true                            // 0.0.0.0/8
    if (a === 10) return true                           // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
    if (a === 192 && b === 168) return true             // 192.168.0.0/16
    if (a === 169 && b === 254) return true             // 169.254.0.0/16 link-local / metadata
    if (a === 100 && b >= 64 && b <= 127) return true  // 100.64.0.0/10 shared
    void c
    return false
  }
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7
  if (lower.startsWith('fe80')) return true                         // link-local
  if (lower.startsWith('::ffff:')) return isPrivateIP(lower.slice(7))
  return false
}

async function isSafeHostname(hostname: string): Promise<boolean> {
  const h = hostname.toLowerCase().replace(/\.+$/, '')
  if (h === 'localhost' || h === 'ip6-localhost') return false
  try {
    const addrs = await dns.promises.lookup(h, { all: true })
    return addrs.every((a) => !isPrivateIP(a.address))
  } catch {
    return false
  }
}

export async function validateSsrfUrl(raw: string): Promise<{ ok: boolean; url?: URL; error?: string }> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http/https URLs allowed' }
  }
  const safe = await isSafeHostname(parsed.hostname)
  if (!safe) return { ok: false, error: 'Hostname resolves to a private address' }
  return { ok: true, url: parsed }
}

// Fetch with redirect: 'manual' and re-validate each hop (prevents a redirect
// from a public URL landing on a private/internal address).
export async function safeFetch(rawUrl: string, hops = 0): Promise<Response | null> {
  if (hops > MAX_REDIRECTS) return null
  const check = await validateSsrfUrl(rawUrl)
  if (!check.ok) return null
  try {
    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'ProjectCheckin-AgentBot/1.0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) return null
      const next = new URL(location, rawUrl).href
      return safeFetch(next, hops + 1)
    }
    return res
  } catch {
    return null
  }
}
