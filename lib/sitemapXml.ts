// Sitemap helpers (phase 3, part F). Google allows 50,000 addresses per sitemap
// file, so /sitemap.xml is an index that points at numbered files of up to
// JOBS_PER_SITEMAP job addresses each, plus one file for the fixed pages, blog,
// portfolios and city pages.

export const JOBS_PER_SITEMAP = 40000

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface SitemapUrl {
  url: string
  lastModified?: Date | null
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function urlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.url)}</loc>` +
        (u.lastModified ? `\n    <lastmod>${u.lastModified.toISOString()}</lastmod>` : '') +
        (u.changeFrequency ? `\n    <changefreq>${u.changeFrequency}</changefreq>` : '') +
        (u.priority !== undefined ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : '') +
        `\n  </url>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
}

export function indexXml(locs: string[]): string {
  const body = locs.map((l) => `  <sitemap>\n    <loc>${escapeXml(l)}</loc>\n  </sitemap>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`
}

export const XML_HEADERS = {
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
}
