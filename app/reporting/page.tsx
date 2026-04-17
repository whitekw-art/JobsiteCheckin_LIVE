import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ReportingJobTableBody } from '@/components/ReportingJobTableBody'
import { ReportingPhotoTableBody } from '@/components/ReportingPhotoTableBody'
import DashboardShell from '@/components/DashboardShell'

type EventCounts = {
  PAGE_VIEW: number
  WEBSITE_CLICK: number
  PHONE_CLICK: number
  PHOTO_CLICK: number
}

const emptyCounts: EventCounts = {
  PAGE_VIEW: 0,
  WEBSITE_CLICK: 0,
  PHONE_CLICK: 0,
  PHOTO_CLICK: 0,
}

// ── SVG helpers ──────────────────────────────────────────────────────────────

function sparklinePoints(values: number[], w = 80, h = 28): string {
  if (values.length < 2) return `0,${h} ${w},${h}`
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  return values.map((v, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - (v / max) * h * 0.88 - h * 0.06).toFixed(1)
    return `${x},${y}`
  }).join(' ')
}

function areaPath(values: number[], w = 520, h = 68): string {
  if (values.length < 2) return ''
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - (v / max) * (h - 8) - 4).toFixed(1)
    return `${x},${y}`
  })
  const lastX = ((values.length - 1) * step).toFixed(1)
  return `M ${pts.join(' L ')} L ${lastX},${h} L 0,${h} Z`
}

function linePath(values: number[], w = 520, h = 68): string {
  if (values.length < 2) return ''
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  return 'M ' + values.map((v, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - (v / max) * (h - 8) - 4).toFixed(1)
    return `${x},${y}`
  }).join(' L ')
}

function pctDelta(recent: number, prev: number): { sign: '+' | '' | '−'; num: number } {
  if (prev === 0 && recent === 0) return { sign: '', num: 0 }
  if (prev === 0) return { sign: '+', num: 100 }
  const pct = Math.round(((recent - prev) / prev) * 100)
  return { sign: pct >= 0 ? '+' : '−', num: Math.abs(pct) }
}

// ── Heatmap SVG (server-rendered, 7-col × 5-row calendar grid) ──────────────

function HeatmapSvg({ series, padding = 5 }: { series: number[]; padding?: number }) {
  const CELL = 14, GAP = 3, COLS = 7
  const total = padding + series.length
  const ROWS = Math.ceil(total / COLS)
  const W = COLS * (CELL + GAP) - GAP        // 116
  const H = ROWS * (CELL + GAP) - GAP        // 82 for 5 rows
  const LABEL_H = 14
  const LEGEND_Y = LABEL_H + H + 8
  const SVG_H = LEGEND_Y + 12

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const cells: React.ReactNode[] = []
  for (let i = 0; i < ROWS * COLS; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = col * (CELL + GAP)
    const y = LABEL_H + row * (CELL + GAP)
    const dataIdx = i - padding
    if (dataIdx < 0 || dataIdx >= series.length) continue
    const val = series[dataIdx]
    const fill = val === 0 ? 'var(--surface-3)'
      : val === 1 ? 'rgba(14,165,233,.28)'
      : val === 2 ? 'rgba(14,165,233,.62)'
      : 'var(--sky)'
    cells.push(<rect key={i} x={x} y={y} width={CELL} height={CELL} rx="2" fill={fill}/>)
  }

  return (
    <svg viewBox={`0 0 ${W} ${SVG_H}`} width="100%" height={SVG_H} style={{ display: 'block' }}>
      {dayLabels.map((label, col) => (
        <text key={col} x={col * (CELL + GAP) + CELL / 2} y={10}
          textAnchor="middle"
          style={{ fontSize: 8.5, fill: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {label}
        </text>
      ))}
      {cells}
      <text x={0} y={LEGEND_Y + 9}
        style={{ fontSize: 8.5, fill: 'var(--t4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Less</text>
      <rect x={70} y={LEGEND_Y} width={9} height={9} rx="2" fill="var(--surface-3)"/>
      <rect x={84} y={LEGEND_Y} width={9} height={9} rx="2" fill="rgba(14,165,233,.28)"/>
      <rect x={98} y={LEGEND_Y} width={9} height={9} rx="2" fill="rgba(14,165,233,.62)"/>
      <rect x={112} y={LEGEND_Y} width={9} height={9} rx="2" fill="var(--sky)"/>
      <text x={125} y={LEGEND_Y + 9}
        style={{ fontSize: 8.5, fill: 'var(--t4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>More</text>
    </svg>
  )
}

// Donut using strokeDasharray on a circle (r=64, circ≈402.1)
const DONUT_R = 64
const DONUT_CIRC = 2 * Math.PI * DONUT_R

function donutDash(fraction: number) {
  const filled = fraction * DONUT_CIRC
  return `${filled.toFixed(1)} ${(DONUT_CIRC - filled).toFixed(1)}`
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string
    sort?: string
    dir?: string
    photoSort?: string
    photoDir?: string
  }>
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.organizationId) {
    return (
      <DashboardShell title="Reporting">
        <div className="db-shell-card">
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>No organization is linked to this account.</p>
        </div>
      </DashboardShell>
    )
  }

  // ── All-time totals ──
  const grouped = await prisma.checkInEvent.groupBy({
    by: ['eventType'],
    where: { checkIn: { organizationId: currentUser.organizationId } },
    _count: { _all: true },
  })

  const counts = grouped.reduce<EventCounts>((acc, row) => {
    const type = row.eventType.toUpperCase() as keyof EventCounts
    if (type in acc) acc[type] += row._count._all
    return acc
  }, { ...emptyCounts })

  // ── Daily time series (last 30 days) ──
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const dailyRaw = await prisma.checkInEvent.findMany({
    where: {
      checkIn: { organizationId: currentUser.organizationId },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { eventType: true, createdAt: true },
  })

  // Build 30-day buckets
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    days.push(d.toISOString().slice(0, 10))
  }

  type DayBucket = { pageViews: number; websiteClicks: number; phoneClicks: number; photoClicks: number }
  const dailyBuckets: Record<string, DayBucket> = {}
  for (const day of days) {
    dailyBuckets[day] = { pageViews: 0, websiteClicks: 0, phoneClicks: 0, photoClicks: 0 }
  }

  for (const ev of dailyRaw) {
    const day = ev.createdAt.toISOString().slice(0, 10)
    if (!dailyBuckets[day]) continue
    const et = ev.eventType.toUpperCase()
    if (et === 'PAGE_VIEW') dailyBuckets[day].pageViews++
    else if (et === 'WEBSITE_CLICK') dailyBuckets[day].websiteClicks++
    else if (et === 'PHONE_CLICK') dailyBuckets[day].phoneClicks++
    else if (et === 'PHOTO_CLICK') dailyBuckets[day].photoClicks++
  }

  const dayValues = days.map(d => dailyBuckets[d])
  const pageViewSeries = dayValues.map(d => d.pageViews)
  const websiteClickSeries = dayValues.map(d => d.websiteClicks)
  const phoneClickSeries = dayValues.map(d => d.phoneClicks)
  const photoClickSeries = dayValues.map(d => d.photoClicks)
  const totalSeries = dayValues.map(d => d.pageViews + d.websiteClicks + d.phoneClicks + d.photoClicks)

  // Delta: last 15 vs prior 15
  function sumSeries(series: number[], from: number, to: number) {
    return series.slice(from, to).reduce((s, v) => s + v, 0)
  }
  const recentPV = sumSeries(pageViewSeries, 15, 30)
  const prevPV   = sumSeries(pageViewSeries, 0, 15)
  const recentWC = sumSeries(websiteClickSeries, 15, 30)
  const prevWC   = sumSeries(websiteClickSeries, 0, 15)
  const recentPC = sumSeries(phoneClickSeries, 15, 30)
  const prevPC   = sumSeries(phoneClickSeries, 0, 15)
  const recentPH = sumSeries(photoClickSeries, 15, 30)
  const prevPH   = sumSeries(photoClickSeries, 0, 15)
  const recentTotal = sumSeries(totalSeries, 15, 30)
  const prevTotal   = sumSeries(totalSeries, 0, 15)

  const totalDelta = pctDelta(recentTotal, prevTotal)

  // ── Portfolio view counts (last 30 days) ──
  const portfolioRaw = await prisma.portfolioView.findMany({
    where: {
      organizationId: currentUser.organizationId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  })

  const portfolioBuckets: Record<string, number> = {}
  for (const day of days) portfolioBuckets[day] = 0
  for (const ev of portfolioRaw) {
    const day = ev.createdAt.toISOString().slice(0, 10)
    if (day in portfolioBuckets) portfolioBuckets[day]++
  }
  const portfolioSeries = days.map(d => portfolioBuckets[d])
  const portfolioThisMonth = sumSeries(portfolioSeries, 15, 30)
  const portfolioLastMonth = sumSeries(portfolioSeries, 0, 15)
  const portfolioTotal = portfolioSeries.reduce((s, v) => s + v, 0)
  const portfolioDelta = pctDelta(portfolioThisMonth, portfolioLastMonth)

  // ── Per-job metrics ──
  const checkIns = await prisma.checkIn.findMany({
    where: { organizationId: currentUser.organizationId },
    select: { id: true, doorType: true, city: true, state: true, timestamp: true },
    orderBy: { timestamp: 'desc' },
  })

  const eventRows = await prisma.checkInEvent.groupBy({
    by: ['checkInId', 'eventType'],
    where: {
      checkIn: { organizationId: currentUser.organizationId },
      eventType: { in: ['PAGE_VIEW', 'page_view', 'PHOTO_CLICK', 'photo_click', 'WEBSITE_CLICK', 'website_click', 'PHONE_CLICK', 'phone_click'] },
    },
    _count: { _all: true },
  })

  const eventMap = new Map<string, { pageViews: number; photoClicks: number; websiteClicks: number; phoneClicks: number }>()

  for (const row of eventRows) {
    const existing = eventMap.get(row.checkInId) || { pageViews: 0, photoClicks: 0, websiteClicks: 0, phoneClicks: 0 }
    const et = row.eventType.toUpperCase()
    if (et === 'PAGE_VIEW') existing.pageViews += row._count._all
    if (et === 'PHOTO_CLICK') existing.photoClicks += row._count._all
    if (et === 'WEBSITE_CLICK') existing.websiteClicks += row._count._all
    if (et === 'PHONE_CLICK') existing.phoneClicks += row._count._all
    eventMap.set(row.checkInId, existing)
  }

  const rows = checkIns.map((checkIn) => {
    const metrics = eventMap.get(checkIn.id) || { pageViews: 0, photoClicks: 0, websiteClicks: 0, phoneClicks: 0 }
    let status = 'Underperforming'
    if (metrics.websiteClicks > 0 || metrics.phoneClicks > 0) status = 'High Intent'
    else if (metrics.photoClicks > 0) status = 'High Interest'
    else if (metrics.pageViews > 0) status = 'Underperforming'
    return { ...checkIn, ...metrics, status }
  })

  const sortField = resolvedSearchParams?.sort || 'pageViews'
  const sortDir = resolvedSearchParams?.dir === 'asc' ? 'asc' : 'desc'
  const sortableFields = new Set(['pageViews', 'photoClicks', 'websiteClicks', 'phoneClicks'])
  if (sortableFields.has(sortField)) {
    rows.sort((a, b) => {
      const left = a[sortField as keyof typeof a] as number
      const right = b[sortField as keyof typeof a] as number
      return sortDir === 'asc' ? left - right : right - left
    })
  }

  const pageSize = 25
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams?.page || '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const buildPageLink = (page: number, sort: string, dir: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (sort) params.set('sort', sort)
    if (dir) params.set('dir', dir)
    return `/reporting?${params.toString()}`
  }

  const toggleDir = (field: string) => {
    if (sortField !== field) return 'desc'
    return sortDir === 'asc' ? 'desc' : 'asc'
  }

  // ── Photo events ──
  const photoEvents = await prisma.checkInEvent.findMany({
    where: {
      eventType: { in: ['PHOTO_CLICK', 'photo_click'] },
      metadata: { not: null },
      checkIn: { organizationId: currentUser.organizationId },
    },
    select: {
      checkInId: true,
      metadata: true,
      checkIn: { select: { doorType: true, city: true, state: true } },
    },
  })

  const photoMap = new Map<string, { checkInId: string; photoUrl: string; photoIndex: number; doorType: string; location: string; totalClicks: number }>()

  for (const event of photoEvents) {
    if (!event.metadata) continue
    try {
      const parsed = JSON.parse(event.metadata) as { photoIndex?: number; photoUrl?: string }
      if (typeof parsed.photoIndex !== 'number' || !parsed.photoUrl) continue
      const doorType = event.checkIn?.doorType || 'Job'
      const location = [event.checkIn?.city, event.checkIn?.state].filter(Boolean).join(', ')
      const key = `${event.checkInId}:${parsed.photoIndex}`
      const existing = photoMap.get(key)
      if (existing) { existing.totalClicks += 1 }
      else { photoMap.set(key, { checkInId: event.checkInId, photoUrl: parsed.photoUrl, photoIndex: parsed.photoIndex, doorType, location: location || 'Unknown', totalClicks: 1 }) }
    } catch { /* ignore bad metadata */ }
  }

  const photoRows = Array.from(photoMap.values()).map((row) => ({
    checkInId: row.checkInId,
    photoUrl: row.photoUrl,
    doorType: row.doorType,
    location: row.location,
    shortId: row.checkInId.slice(0, 8),
    totalClicks: row.totalClicks,
  }))

  const photoSortField = resolvedSearchParams?.photoSort || 'totalClicks'
  const photoSortDir = resolvedSearchParams?.photoDir === 'asc' ? 'asc' : 'desc'
  const photoSortableFields = new Set(['totalClicks', 'doorType', 'location'])
  if (photoSortableFields.has(photoSortField)) {
    photoRows.sort((a, b) => {
      if (photoSortField === 'totalClicks') return photoSortDir === 'asc' ? a.totalClicks - b.totalClicks : b.totalClicks - a.totalClicks
      const left = (a[photoSortField as keyof typeof a] as string).toLowerCase()
      const right = (b[photoSortField as keyof typeof b] as string).toLowerCase()
      if (left === right) return 0
      const order = left < right ? -1 : 1
      return photoSortDir === 'asc' ? order : -order
    })
  }

  const buildPhotoLink = (sort: string, dir: string) => {
    const params = new URLSearchParams()
    params.set('page', String(safePage))
    params.set('sort', sortField)
    params.set('dir', sortDir)
    params.set('photoSort', sort)
    params.set('photoDir', dir)
    return `/reporting?${params.toString()}`
  }

  const tableRows = pageRows.map((row) => {
    const jobTitle = [row.doorType || 'Job', [row.city, row.state].filter(Boolean).join(', ')].filter(Boolean).join(' \u2022 ')
    const createdDate = row.timestamp ? new Date(row.timestamp).toLocaleDateString() : ''
    const statusStyles = row.status === 'High Intent' ? 'bg-emerald-100 text-emerald-700' : row.status === 'High Interest' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
    return { id: row.id, jobTitle, createdDate, pageViews: row.pageViews, photoClicks: row.photoClicks, websiteClicks: row.websiteClicks, phoneClicks: row.phoneClicks, status: row.status, statusStyles }
  })

  // ── Donut data ──
  const engagementTotal = counts.PAGE_VIEW + counts.WEBSITE_CLICK + counts.PHONE_CLICK + counts.PHOTO_CLICK
  const pvFrac  = engagementTotal > 0 ? counts.PAGE_VIEW / engagementTotal : 0
  const wcFrac  = engagementTotal > 0 ? counts.WEBSITE_CLICK / engagementTotal : 0
  const pcFrac  = engagementTotal > 0 ? counts.PHONE_CLICK / engagementTotal : 0
  const phFrac  = engagementTotal > 0 ? counts.PHOTO_CLICK / engagementTotal : 0

  // Donut strokeDashoffset: rotate so first slice starts at top (−DONUT_CIRC/4 offset)
  const pvOffset  = -(DONUT_CIRC / 4)
  const wcOffset  = pvOffset - pvFrac * DONUT_CIRC
  const pcOffset  = wcOffset - wcFrac * DONUT_CIRC
  const phOffset  = pcOffset - pcFrac * DONUT_CIRC

  return (
    <DashboardShell title="Reporting">

      {/* ── Hero trend card ── */}
      <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: 6 }}>
              Total Engagement — Last 30 Days
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.5px' }}>
              {recentTotal.toLocaleString()}
            </div>
            {(totalDelta.num > 0 || totalDelta.sign !== '') && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: totalDelta.sign === '+' ? 'var(--green)' : totalDelta.sign === '−' ? 'var(--red)' : 'var(--t3)', marginTop: 4 }}>
                {totalDelta.sign !== '' && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {totalDelta.sign === '+' ? <polyline points="2,7 5,3 8,7"/> : <polyline points="2,3 5,7 8,3"/>}
                  </svg>
                )}
                {totalDelta.sign !== '' ? `${totalDelta.sign}${totalDelta.num}% vs prior 15 days` : 'No data yet'}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>All events</div>
        </div>
        <div style={{ padding: '0 22px 20px' }}>
          <svg viewBox="0 0 520 72" width="100%" height="72" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sky)" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="var(--sky)" stopOpacity="0.01"/>
              </linearGradient>
            </defs>
            {totalSeries.some(v => v > 0) ? (
              <>
                <path d={areaPath(totalSeries, 520, 68)} fill="url(#areaGrad)"/>
                <path d={linePath(totalSeries, 520, 68)} fill="none" stroke="var(--sky)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            ) : (
              <line x1="0" y1="64" x2="520" y2="64" stroke="var(--border-2)" strokeWidth="1" strokeDasharray="4 4"/>
            )}
          </svg>
        </div>
      </div>

      {/* ── Sparkline stat cards ── */}
      <div className="rpt-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Page Views', count: counts.PAGE_VIEW, recent: recentPV, prev: prevPV, series: pageViewSeries, color: 'var(--sky)' },
          { label: 'Phone Clicks', count: counts.PHONE_CLICK, recent: recentPC, prev: prevPC, series: phoneClickSeries, color: 'var(--green)' },
          { label: 'Website Clicks', count: counts.WEBSITE_CLICK, recent: recentWC, prev: prevWC, series: websiteClickSeries, color: '#8B5CF6' },
          { label: 'Photo Views', count: counts.PHOTO_CLICK, recent: recentPH, prev: prevPH, series: photoClickSeries, color: 'var(--orange)' },
        ].map(({ label, count, recent, prev, series, color }) => {
          const delta = pctDelta(recent, prev)
          return (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-card)', padding: '16px 18px 12px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.3px' }}>{count.toLocaleString()}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3, color: delta.sign === '+' ? 'var(--green)' : delta.sign === '−' ? 'var(--red)' : 'var(--t3)' }}>
                {delta.sign !== '' ? `${delta.sign}${delta.num}% (15d)` : 'All time'}
              </div>
              <div style={{ marginTop: 10 }}>
                <svg viewBox="0 0 80 28" width="100%" height="28" preserveAspectRatio="none" style={{ display: 'block' }}>
                  {series.some(v => v > 0) ? (
                    <polyline
                      points={sparklinePoints(series)}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <line x1="0" y1="24" x2="80" y2="24" stroke="var(--border-2)" strokeWidth="1" strokeDasharray="4 3"/>
                  )}
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Google Business Profile section ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Google Business Profile Performance</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Profile views, direction requests, and search appearances from your Google listing</div>
          </div>
          <Link
            href="/account"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--t2)', textDecoration: 'none', flexShrink: 0 }}
          >
            Connect GBP
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
        <div className="rpt-gbp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['Profile Views', 'Direction Requests', 'Search Appearances'].map((label, i) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t3)', lineHeight: 1, letterSpacing: '-0.3px' }}>—</div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: 'var(--surface-3)' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
          Connect your Google Business Profile in{' '}
          <Link href="/account" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>
            Account &rsaquo; Connections
          </Link>{' '}
          to see GBP metrics here.
        </div>
      </div>

      {/* ── Engagement breakdown ── */}
      <div className="rpt-engagement-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Donut card — flex-column so content fills full tile height */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>Engagement Breakdown</div>
          {engagementTotal > 0 ? (
            <div className="rpt-donut-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '12px 0' }}>
              <svg className="rpt-donut-svg" viewBox="0 0 160 160" width="160" height="160" style={{ flexShrink: 0 }}>
                <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="var(--surface-3)" strokeWidth="22"/>
                {pvFrac > 0 && (
                  <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="var(--sky)" strokeWidth="22"
                    strokeDasharray={donutDash(pvFrac)} strokeDashoffset={pvOffset} strokeLinecap="butt"/>
                )}
                {wcFrac > 0 && (
                  <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="#8B5CF6" strokeWidth="22"
                    strokeDasharray={donutDash(wcFrac)} strokeDashoffset={wcOffset} strokeLinecap="butt"/>
                )}
                {pcFrac > 0 && (
                  <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="var(--green)" strokeWidth="22"
                    strokeDasharray={donutDash(pcFrac)} strokeDashoffset={pcOffset} strokeLinecap="butt"/>
                )}
                {phFrac > 0 && (
                  <circle cx="80" cy="80" r={DONUT_R} fill="none" stroke="var(--orange)" strokeWidth="22"
                    strokeDasharray={donutDash(phFrac)} strokeDashoffset={phOffset} strokeLinecap="butt"/>
                )}
                <text x="80" y="80" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: 20, fontWeight: 800, fill: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {engagementTotal}
                </text>
              </svg>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Page Views', val: counts.PAGE_VIEW, color: 'var(--sky)' },
                  { label: 'Website Clicks', val: counts.WEBSITE_CLICK, color: '#8B5CF6' },
                  { label: 'Phone Clicks', val: counts.PHONE_CLICK, color: 'var(--green)' },
                  { label: 'Photo Views', val: counts.PHOTO_CLICK, color: 'var(--orange)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 13 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                    <span style={{ flex: 1, color: 'var(--t2)' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>No engagement data yet. Publish a job to start tracking.</div>
            </div>
          )}
        </div>

        {/* Right column: Recent GBP Posts + Portfolio Views side by side */}
        <div className="rpt-sidebar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Recent GBP Posts */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 16px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>Recent GBP Posts</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 30px)', gap: 10, paddingTop: 8 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.5 }}>
                No posts yet.{' '}
                <Link href="/account" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>
                  Connect GBP
                </Link>
              </div>
            </div>
          </div>

          {/* Portfolio Views */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 16px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Portfolio Views</div>
            {portfolioTotal > 0 ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.3px' }}>
                  {portfolioThisMonth.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3, marginBottom: 10, color: portfolioDelta.sign === '+' ? 'var(--green)' : portfolioDelta.sign === '−' ? 'var(--red)' : 'var(--t3)' }}>
                  {portfolioDelta.sign !== '' ? `${portfolioDelta.sign}${portfolioDelta.num}% vs prior 15d` : 'Last 15 days'}
                </div>
                <HeatmapSvg series={portfolioSeries} />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, paddingTop: 8 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.5 }}>
                  No data yet.{' '}
                  <Link href="/account" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>
                    Share your link
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Per-job table ── */}
      <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="db-shell-card-title" style={{ marginBottom: 0 }}>Per-Job Performance</div>
        </div>
        {pageRows.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--t3)' }}>No job performance data yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="db-shell-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>
                    <Link href={buildPageLink(1, 'pageViews', toggleDir('pageViews'))} style={{ color: 'inherit', textDecoration: 'none' }}>Page Views</Link>
                  </th>
                  <th>
                    <Link href={buildPageLink(1, 'photoClicks', toggleDir('photoClicks'))} style={{ color: 'inherit', textDecoration: 'none' }}>Photo Clicks</Link>
                  </th>
                  <th>
                    <Link href={buildPageLink(1, 'websiteClicks', toggleDir('websiteClicks'))} style={{ color: 'inherit', textDecoration: 'none' }}>Website Clicks</Link>
                  </th>
                  <th>
                    <Link href={buildPageLink(1, 'phoneClicks', toggleDir('phoneClicks'))} style={{ color: 'inherit', textDecoration: 'none' }}>Phone Clicks</Link>
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <ReportingJobTableBody rows={tableRows} />
            </table>
          </div>
        )}
        {pageRows.length > 0 && (
          <div className="db-shell-pagination" style={{ padding: '12px 24px' }}>
            <span>Page {safePage} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href={buildPageLink(Math.max(1, safePage - 1), sortField, sortDir)} className="db-shell-page-btn" aria-disabled={safePage === 1}>Prev</Link>
              <Link href={buildPageLink(Math.min(totalPages, safePage + 1), sortField, sortDir)} className="db-shell-page-btn" aria-disabled={safePage === totalPages}>Next</Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Top photos table ── */}
      <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="db-shell-card-title" style={{ marginBottom: 0 }}>Top Performing Photos</div>
        </div>
        {photoRows.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--t3)' }}>No photo click data yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="db-shell-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>
                    <Link href={buildPhotoLink('doorType', photoSortField === 'doorType' && photoSortDir === 'asc' ? 'desc' : 'asc')} style={{ color: 'inherit', textDecoration: 'none' }}>Door Type</Link>
                  </th>
                  <th>
                    <Link href={buildPhotoLink('location', photoSortField === 'location' && photoSortDir === 'asc' ? 'desc' : 'asc')} style={{ color: 'inherit', textDecoration: 'none' }}>Location</Link>
                  </th>
                  <th>Job ID</th>
                  <th>
                    <Link href={buildPhotoLink('totalClicks', photoSortField === 'totalClicks' && photoSortDir === 'asc' ? 'desc' : 'asc')} style={{ color: 'inherit', textDecoration: 'none' }}>Total Clicks</Link>
                  </th>
                </tr>
              </thead>
              <ReportingPhotoTableBody rows={photoRows} />
            </table>
          </div>
        )}
      </div>

    </DashboardShell>
  )
}
