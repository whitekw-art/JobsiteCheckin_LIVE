// Vercel domain management for CNAME subdomain hosting (Phase 2 of
// Website Integration for Local SEO). Registers customer subdomains
// against this Vercel project so Vercel routes traffic + issues SSL.
//
// Required env (Vercel dashboard → Settings → Environment Variables):
//   VERCEL_TOKEN      — API token with domain scope
//   VERCEL_PROJECT_ID — this project's ID
//   VERCEL_TEAM_ID    — team ID (omit for personal accounts)
//
// If VERCEL_TOKEN is not set, registration is skipped (the domain can be
// attached manually in the Vercel dashboard) and verification falls back
// to the DNS check alone.

const VERCEL_API = 'https://api.vercel.com'

// The CNAME target customers point their subdomain at.
export const CNAME_TARGET = process.env.NEXT_PUBLIC_CNAME_TARGET || 'cname.vercel-dns.com'

function vercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID)
}

function teamQuery(): string {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
}

async function vercelFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

/** Register a domain on this Vercel project. Idempotent — an already-added
 *  domain returns a 409 which is treated as success. */
export async function addDomainToProject(
  domain: string
): Promise<{ ok: boolean; error?: string }> {
  if (!vercelConfigured()) return { ok: true }
  try {
    const res = await vercelFetch(
      `/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${teamQuery()}`,
      { method: 'POST', body: JSON.stringify({ name: domain }) }
    )
    if (res.ok || res.status === 409) return { ok: true }
    const body = await res.json().catch(() => null)
    return { ok: false, error: body?.error?.message || `Vercel API ${res.status}` }
  } catch (err) {
    console.error('Vercel addDomain failed:', err)
    return { ok: false, error: 'Could not reach Vercel API' }
  }
}

/** Remove a domain from this Vercel project (when a customer changes or
 *  clears their subdomain). Missing domain (404) is treated as success. */
export async function removeDomainFromProject(
  domain: string
): Promise<{ ok: boolean; error?: string }> {
  if (!vercelConfigured()) return { ok: true }
  try {
    const res = await vercelFetch(
      `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${teamQuery()}`,
      { method: 'DELETE' }
    )
    if (res.ok || res.status === 404) return { ok: true }
    const body = await res.json().catch(() => null)
    return { ok: false, error: body?.error?.message || `Vercel API ${res.status}` }
  } catch (err) {
    console.error('Vercel removeDomain failed:', err)
    return { ok: false, error: 'Could not reach Vercel API' }
  }
}

/** Vercel-side status: is the domain attached, verified, and correctly configured? */
export async function checkVercelDomain(
  domain: string
): Promise<{ attached: boolean; verified: boolean; misconfigured: boolean }> {
  // Without API access, report attached+verified so the DNS check alone decides.
  if (!vercelConfigured()) return { attached: true, verified: true, misconfigured: false }
  try {
    const [domainRes, configRes] = await Promise.all([
      vercelFetch(
        `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${teamQuery()}`
      ),
      vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config${teamQuery()}`),
    ])
    if (!domainRes.ok) return { attached: false, verified: false, misconfigured: true }
    const domainBody = await domainRes.json().catch(() => null)
    const configBody = configRes.ok ? await configRes.json().catch(() => null) : null
    return {
      attached: true,
      verified: domainBody?.verified === true,
      misconfigured: configBody?.misconfigured !== false,
    }
  } catch (err) {
    console.error('Vercel checkDomain failed:', err)
    return { attached: false, verified: false, misconfigured: true }
  }
}

/** Customer-side check via DNS-over-HTTPS: does the subdomain's CNAME point
 *  at our target? Works without any Vercel credentials. */
export async function checkDnsPointsToUs(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    )
    if (!res.ok) return false
    const body = (await res.json()) as { Answer?: Array<{ type: number; data: string }> }
    const answers = body.Answer ?? []
    return answers.some(
      (a) => a.type === 5 && a.data.replace(/\.$/, '').toLowerCase() === CNAME_TARGET.toLowerCase()
    )
  } catch {
    return false
  }
}
