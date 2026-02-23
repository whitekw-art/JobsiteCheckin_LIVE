'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface JobData {
  id: string
  doorType: string
  city: string
  state: string
  photos: string[]
  thumbnail: string | null
  jobPath: string
  notes: string | null
  timestamp: string | null
}

interface FilterTab {
  label: string
  type: string
  count: number
}

interface PortfolioClientProps {
  orgName: string
  orgPhone: string | null
  normalizedWebsite: string
  regionDescription: string
  heroPhotos: string[]
  jobCount: number
  yearsInBusiness: number
  jobs: JobData[]
  filterTabs: FilterTab[]
  baseUrl: string
}

/* ═══════════════════════════════════════════
   NOISE TEXTURE — inline SVG data URL
   ═══════════════════════════════════════════ */

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

// Intersection Observer — triggers once when element enters viewport
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px', ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { ref, inView }
}

// Card hover parallax
function useCardParallax() {
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget
    const img = card.querySelector<HTMLElement>('[data-parallax-img]')
    if (!img) return
    const rect = card.getBoundingClientRect()
    const y = (e.clientY - rect.top) / rect.height
    img.style.transform = `scale(1.04) translateY(${(y - 0.5) * 8}px)`
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const img = e.currentTarget.querySelector<HTMLElement>('[data-parallax-img]')
    if (img) img.style.transform = ''
  }, [])

  return { handleMouseMove, handleMouseLeave }
}

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Assign varied aspect ratios for masonry feel
const ASPECT_CLASSES = [
  'aspect-[4/3]',
  'aspect-[3/2]',
  'aspect-[5/4]',
  'aspect-[16/10]',
  'aspect-square',
]
function getAspectClass(index: number): string {
  return ASPECT_CLASSES[index % ASPECT_CLASSES.length]
}

/* ═══════════════════════════════════════════
   SVG ICONS (reusable)
   ═══════════════════════════════════════════ */

const PhoneIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
)

const GlobeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.029 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
  </svg>
)

const ChevronLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const ChevronRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
)

const ImagePlaceholder = ({ className = 'w-12 h-12' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
)

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function PortfolioClient({
  orgName,
  orgPhone,
  normalizedWebsite,
  regionDescription,
  heroPhotos,
  jobCount,
  yearsInBusiness,
  jobs,
  filterTabs,
  baseUrl,
}: PortfolioClientProps) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [showCount, setShowCount] = useState(12)
  const { handleMouseMove, handleMouseLeave } = useCardParallax()

  // Filter jobs
  const filteredJobs = activeFilter === 'all' ? jobs : jobs.filter((j) => j.doorType === activeFilter)
  const visibleJobs = filteredJobs.slice(0, showCount)
  const hasMore = showCount < filteredJobs.length
  const remaining = filteredJobs.length - showCount

  // Featured projects: first 6 jobs (most recent, already sorted desc)
  const featuredJobs = jobs.slice(0, Math.min(6, jobs.length))

  // Few-jobs mode: skip grid if <4 jobs
  const showGrid = jobs.length >= 4

  // Reset showCount when filter changes
  const handleFilterChange = useCallback((type: string) => {
    setActiveFilter(type)
    setShowCount(12)
  }, [])

  return (
    <>
      {/* ═══ STICKY NAV — appears on scroll-up ═══ */}
      <StickyNav orgName={orgName} orgPhone={orgPhone} />

      {/* ═══ BAND 1: HERO ═══ */}
      <HeroBand
        orgName={orgName}
        orgPhone={orgPhone}
        normalizedWebsite={normalizedWebsite}
        regionDescription={regionDescription}
        heroPhotos={heroPhotos}
        jobCount={jobCount}
        yearsInBusiness={yearsInBusiness}
      />

      {/* ═══ BAND 2: FEATURED PROJECTS ═══ */}
      {featuredJobs.length > 0 && (
        <FeaturedSection
          jobs={featuredJobs}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* ═══ BAND 3: ALL PROJECTS (filter + masonry) ═══ */}
      {showGrid && (
        <AllProjectsSection
          jobs={jobs}
          filterTabs={filterTabs}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          visibleJobs={visibleJobs}
          hasMore={hasMore}
          remaining={remaining}
          showCount={showCount}
          onLoadMore={() => setShowCount((prev) => prev + 12)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* ═══ BAND 4: CTA ═══ */}
      {(orgPhone || normalizedWebsite) && (
        <CtaBand orgName={orgName} orgPhone={orgPhone} normalizedWebsite={normalizedWebsite} />
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-surface-50 border-t border-surface-200 text-center py-5 px-4">
        <p className="text-xs text-surface-500">
          Powered by{' '}
          <a href={baseUrl || '/'} className="font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Jobsite Check-In
          </a>
        </p>
        <p className="text-[0.68rem] text-surface-400 mt-0.5">Automatic portfolios for service businesses</p>
      </footer>
    </>
  )
}

/* ═══════════════════════════════════════════
   STICKY NAV — shows on scroll-up past hero
   ═══════════════════════════════════════════ */

function StickyNav({ orgName, orgPhone }: { orgName: string; orgPhone: string | null }) {
  const [visible, setVisible] = useState(false)
  const lastScrollRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.75
      if (scrollY > heroHeight) {
        setVisible(scrollY < lastScrollRef.current)
      } else {
        setVisible(false)
      }
      lastScrollRef.current = scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        background: 'rgba(15, 31, 23, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 145, 42, 0.15)',
      }}
    >
      <div className="max-w-[76rem] mx-auto px-5 py-2.5 flex items-center justify-between">
        <span className="font-display font-bold text-[0.95rem] text-white tracking-tight">{orgName}</span>
        {orgPhone && (
          <a
            href={`tel:${orgPhone.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-[0.8rem] px-4 py-1.5 rounded-md min-h-[36px] transition-all duration-200"
            style={{ border: '1px solid rgba(212, 145, 42, 0.25)' }}
          >
            <PhoneIcon className="w-3.5 h-3.5" />
            Get a Free Estimate
          </a>
        )}
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════
   BAND 1: HERO
   Dark gradient, auto-cycling photos (zoom+fade),
   bottom-left overlay text, glass stats, arrows+dots
   ═══════════════════════════════════════════ */

function HeroBand({
  orgName,
  orgPhone,
  normalizedWebsite,
  regionDescription,
  heroPhotos,
  jobCount,
  yearsInBusiness,
}: {
  orgName: string
  orgPhone: string | null
  normalizedWebsite: string
  regionDescription: string
  heroPhotos: string[]
  jobCount: number
  yearsInBusiness: number
}) {
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const photoCount = heroPhotos.length

  // Auto-cycle hero photos every 5s
  const startAutoplay = useCallback(() => {
    if (photoCount <= 1) return
    intervalRef.current = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % photoCount)
    }, 5000)
  }, [photoCount])

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    startAutoplay()
  }, [startAutoplay])

  useEffect(() => {
    startAutoplay()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startAutoplay])

  // Fade in hero content on load
  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const goTo = (index: number) => {
    setCurrentPhoto((index + photoCount) % photoCount)
    resetAutoplay()
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{
        height: '75vh',
        minHeight: '500px',
        maxHeight: '900px',
        background: 'linear-gradient(160deg, #0f1f17 0%, #0a1610 40%, #080e0b 100%)',
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ backgroundImage: NOISE_BG, backgroundSize: '200px 200px', opacity: 0.035 }}
      />
      {/* Subtle diagonal pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.025,
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
        }}
      />

      {/* Hero photo reel */}
      {heroPhotos.map((photo, i) => (
        <div
          key={i}
          className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: i === currentPhoto ? 1 : 0,
            transform: i === currentPhoto ? 'scale(1.06)' : 'scale(1)',
            transition: `opacity 1.2s ease-in-out, transform 6s ease-out`,
          }}
        >
          <Image
            src={photo}
            alt={`${orgName} project photo ${i + 1}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Fallback when no photos */}
      {heroPhotos.length === 0 && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-900/50 to-primary-950/80 flex items-center justify-center">
          <span className="text-6xl text-white/10">&#x1F6AA;</span>
        </div>
      )}

      {/* Dark scrim for text readability */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(to top, rgba(10,22,16,0.95) 0%, rgba(10,22,16,0.7) 35%, rgba(10,22,16,0.35) 60%, rgba(10,22,16,0.2) 100%), linear-gradient(to right, rgba(10,22,16,0.6) 0%, transparent 70%)',
        }}
      />

      {/* Soft gold glow behind text area */}
      <div
        className="absolute bottom-[10%] left-[5%] w-[50%] h-[60%] pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse, rgba(212,145,42,0.06) 0%, transparent 70%)' }}
      />

      {/* Hero content — bottom-left overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-[5] px-5 pb-8 pt-6 sm:px-8 md:pb-10 lg:px-10 lg:pb-12 max-w-[76rem] mx-auto transition-all duration-700 ease-out ${
          heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <h1 className="font-display text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem] font-bold text-white tracking-tight leading-[1.1]">
          {orgName}
        </h1>
        <p className="mt-2 text-white/70 text-[0.95rem] leading-relaxed">
          Professional door installation &amp; replacement
          {regionDescription && (
            <span className="text-amber-400/90 font-medium"> &middot; {regionDescription}</span>
          )}
        </p>

        {/* Glass stat badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.78rem] font-medium text-white/90"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,145,42,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-3.09 1.323 2.302.986a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3z" />
              <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
            </svg>
            <span className="font-display font-bold text-white">{jobCount}</span> {jobCount === 1 ? 'job' : 'jobs'} completed
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.78rem] font-medium text-white/90"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,145,42,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="font-display font-bold text-white">{yearsInBusiness}</span> {yearsInBusiness === 1 ? 'year' : 'years'} in business
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-2 mt-5">
          {orgPhone && (
            <a
              href={`tel:${orgPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
              style={{
                border: '1px solid rgba(212,145,42,0.2)',
                boxShadow: '0 2px 10px rgba(54,101,78,0.25)',
              }}
            >
              <PhoneIcon />
              Get a Free Estimate
            </a>
          )}
          {normalizedWebsite && (
            <a
              href={normalizedWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white font-semibold px-5 py-2.5 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <GlobeIcon />
              Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Photo reel controls: arrows + dots */}
      {photoCount > 1 && (
        <div
          className={`absolute bottom-6 right-5 sm:bottom-8 sm:right-8 z-[6] flex items-center gap-3 transition-opacity duration-500 ${
            heroLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '0.5s' }}
        >
          <button
            onClick={() => goTo(currentPhoto - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer text-white transition-all duration-200 hover:border-amber-500/30"
            style={{
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft />
          </button>
          <div className="flex gap-1.5 items-center">
            {heroPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-[7px] rounded-full cursor-pointer transition-all duration-300 ${
                  i === currentPhoto
                    ? 'w-5 bg-amber-400 shadow-[0_0_6px_rgba(212,145,42,0.4)]'
                    : 'w-[7px] bg-white/30'
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(currentPhoto + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer text-white transition-all duration-200 hover:border-amber-500/30"
            style={{
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            aria-label="Next photo"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════
   BAND 2: FEATURED PROJECTS
   Horizontal scroll of spotlight cards
   ═══════════════════════════════════════════ */

function FeaturedSection({
  jobs,
  onMouseMove,
  onMouseLeave,
}: {
  jobs: JobData[]
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const { ref, inView } = useInView()

  return (
    <section className="py-8 md:py-10 bg-surface-50 border-b border-surface-200">
      <div className="max-w-[76rem] mx-auto px-5 md:px-6 lg:px-8">
        <div
          ref={ref}
          className={`flex items-center gap-3 mb-5 transition-all duration-600 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="font-display text-xl font-bold text-surface-900">Featured Projects</h2>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(212,145,42,0.4), transparent)' }} />
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-3"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1cec7 transparent',
          }}
        >
          {jobs.map((job, i) => (
            <FeaturedCard
              key={job.id}
              job={job}
              index={i}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedCard({
  job,
  index,
  onMouseMove,
  onMouseLeave,
}: {
  job: JobData
  index: number
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const { ref, inView } = useInView()

  return (
    <Link
      href={job.jobPath}
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={`group block flex-shrink-0 w-[320px] min-[500px]:w-[340px] md:w-[360px] bg-white rounded-xl overflow-hidden border border-surface-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{
        scrollSnapAlign: 'start',
        transitionDelay: `${index * 0.05}s`,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Gold accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to right, #e8a83a, #b87420, transparent)' }} />

      <div className="aspect-[16/10] bg-surface-100 overflow-hidden relative">
        {job.thumbnail ? (
          <Image
            data-parallax-img
            src={job.thumbnail}
            alt={`${job.doorType} in ${job.city}, ${job.state}`}
            fill
            className="object-cover transition-transform duration-400"
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
          />
        ) : (
          <div data-parallax-img className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <ImagePlaceholder />
          </div>
        )}
      </div>

      <div className="px-4 py-3.5">
        <span className="inline-block text-[0.68rem] font-bold text-primary-700 uppercase tracking-wide px-2 py-0.5 rounded bg-primary-50 border border-primary-100">
          {job.doorType}
        </span>
        <div className="mt-2 font-display text-[0.95rem] font-semibold text-surface-900 leading-tight group-hover:text-primary-600 transition-colors duration-200">
          {job.doorType} in {[job.city, job.state].filter(Boolean).join(', ')}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[0.76rem] text-surface-500">
          <span>{[job.city, job.state].filter(Boolean).join(', ')}</span>
          {job.timestamp && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-surface-400" />
              <span>{formatDate(job.timestamp)}</span>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 mt-2 text-[0.78rem] font-semibold text-primary-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-250">
          View project &rarr;
        </span>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════
   BAND 3: ALL PROJECTS
   Filter buttons + masonry grid
   ═══════════════════════════════════════════ */

function AllProjectsSection({
  jobs,
  filterTabs,
  activeFilter,
  onFilterChange,
  visibleJobs,
  hasMore,
  remaining,
  showCount,
  onLoadMore,
  onMouseMove,
  onMouseLeave,
}: {
  jobs: JobData[]
  filterTabs: FilterTab[]
  activeFilter: string
  onFilterChange: (type: string) => void
  visibleJobs: JobData[]
  hasMore: boolean
  remaining: number
  showCount: number
  onLoadMore: () => void
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const { ref, inView } = useInView()

  return (
    <section className="py-8 bg-white border-b border-surface-200">
      <div className="max-w-[76rem] mx-auto px-5 md:px-6 lg:px-8">
        <div
          ref={ref}
          className={`transition-all duration-600 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-xl font-bold text-surface-900">All Projects</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(212,145,42,0.4), transparent)' }} />
          </div>

          {/* Filter buttons */}
          {filterTabs.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {filterTabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => onFilterChange(tab.type)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.8rem] font-semibold min-h-[36px] cursor-pointer transition-all duration-200 ${
                    activeFilter === tab.type
                      ? 'bg-primary-700 text-white border border-primary-700'
                      : 'bg-white text-surface-600 border border-surface-300 hover:border-primary-400 hover:text-primary-700'
                  }`}
                >
                  {tab.label}
                  <span className="text-[0.68rem] opacity-60">{tab.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Masonry grid with varied aspect ratios */}
        <div className="[columns:2] min-[768px]:[columns:3] [column-gap:0.85rem] min-[768px]:[column-gap:1rem]">
          {visibleJobs.map((job, i) => (
            <MasonryCard
              key={job.id}
              job={job}
              index={i}
              isNew={showCount > 12 && i >= showCount - 12}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={onLoadMore}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-surface-50 text-surface-700 font-semibold px-6 py-2.5 rounded-lg text-[0.85rem] min-h-[44px] border border-surface-300 hover:border-amber-400 hover:text-surface-900 hover:-translate-y-px transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Load more projects ({remaining} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function MasonryCard({
  job,
  index,
  isNew,
  onMouseMove,
  onMouseLeave,
}: {
  job: JobData
  index: number
  isNew: boolean
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => void
}) {
  const { ref, inView } = useInView()
  const aspectClass = getAspectClass(index)

  return (
    <Link
      href={job.jobPath}
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={`group block bg-surface-50 rounded-[0.6rem] overflow-hidden border border-surface-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-[3px] transition-all duration-300 cursor-pointer mb-3 min-[768px]:mb-4 break-inside-avoid ${
        isNew
          ? inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          : ''
      }`}
      style={isNew ? { transitionDuration: '400ms', transitionDelay: `${(index % 12) * 0.06}s` } : undefined}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className={`${aspectClass} bg-surface-100 overflow-hidden relative`}>
        {job.thumbnail ? (
          <Image
            data-parallax-img
            src={job.thumbnail}
            alt={`${job.doorType} in ${job.city}, ${job.state}`}
            fill
            className="object-cover transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div data-parallax-img className="w-full h-full flex items-center justify-center">
            <ImagePlaceholder className="w-10 h-10 text-surface-300" />
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <div className="font-display text-[0.8rem] font-semibold text-surface-900 leading-tight group-hover:text-primary-600 transition-colors duration-200">
          {job.doorType} in {[job.city, job.state].filter(Boolean).join(', ') || 'Location unavailable'}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[0.7rem] text-surface-500">
          <span>{job.doorType}</span>
          {job.timestamp && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-surface-400" />
              <span>{formatDate(job.timestamp)}</span>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 mt-1.5 text-[0.7rem] font-semibold text-primary-600 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
          View project &rarr;
        </span>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════
   BAND 4: CTA
   Dark gradient matching hero, gold accents
   ═══════════════════════════════════════════ */

function CtaBand({
  orgName,
  orgPhone,
  normalizedWebsite,
}: {
  orgName: string
  orgPhone: string | null
  normalizedWebsite: string
}) {
  const { ref, inView } = useInView()

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: 'linear-gradient(160deg, #0f1f17 0%, #0a1610 50%, #080e0b 100%)' }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ backgroundImage: NOISE_BG, backgroundSize: '200px 200px', opacity: 0.035 }}
      />
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.025,
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
        }}
      />
      {/* Gold top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-[2]"
        style={{ background: 'linear-gradient(to right, transparent, #e8a83a, #d4912a, #e8a83a, transparent)' }}
      />

      <div
        className={`relative z-[3] max-w-[42rem] mx-auto px-6 text-center transition-all duration-600 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="font-display text-[1.5rem] sm:text-[1.8rem] font-bold text-white">
          Need a door installed or replaced?
        </h2>
        <p className="mt-2 text-white/60 text-[0.92rem]">
          Get a free estimate from {orgName}.
        </p>
        <div className="flex justify-center gap-2.5 mt-6 flex-wrap">
          {orgPhone && (
            <a
              href={`tel:${orgPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
              style={{
                border: '1px solid rgba(212,145,42,0.2)',
                boxShadow: '0 2px 10px rgba(54,101,78,0.25)',
              }}
            >
              <PhoneIcon />
              Get a Free Estimate
            </a>
          )}
          {normalizedWebsite && (
            <a
              href={normalizedWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1px solid rgba(212,145,42,0.35)',
              }}
            >
              <GlobeIcon />
              Visit Website
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
