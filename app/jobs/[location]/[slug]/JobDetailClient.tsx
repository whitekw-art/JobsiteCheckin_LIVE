'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { JobPhoneLink } from '@/components/JobPhoneLink'
import { JobWebsiteLink } from '@/components/JobWebsiteLink'

/* ===================================================================
   TYPES
   =================================================================== */

interface RelatedJob {
  id: string
  doorType: string
  city: string
  state: string
  thumbnail: string | null
  jobPath: string
  timestamp: string | null
}

interface JobDetailProps {
  checkInId: string
  title: string
  description: string
  doorType: string
  city: string
  state: string
  zip: string
  notes: string | null
  timestamp: string | null
  photos: string[]
  businessName: string
  businessPhone: string
  normalizedWebsite: string
  orgSlug: string | null
  relatedJobs: RelatedJob[]
  baseUrl: string
}

/* ===================================================================
   NOISE TEXTURE (same as portfolio)
   =================================================================== */

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/* ===================================================================
   HOOKS
   =================================================================== */

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

/* ===================================================================
   HELPERS
   =================================================================== */

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/* ===================================================================
   SVG ICONS
   =================================================================== */

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

const ChevronLeftIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const ChevronRightIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
)

const CloseIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const MapPinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
)

const CalendarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
)

const ImagePlaceholderIcon = ({ className = 'w-12 h-12' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
)

const ArrowLeftIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
)

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */

export default function JobDetailClient({
  checkInId,
  title,
  description,
  doorType,
  city,
  state,
  zip,
  notes,
  timestamp,
  photos,
  businessName,
  businessPhone,
  normalizedWebsite,
  orgSlug,
  relatedJobs,
  baseUrl,
}: JobDetailProps) {
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const thumbnailStripRef = useRef<HTMLDivElement>(null)

  const location = [city, state].filter(Boolean).join(', ')
  const fullLocation = [city, state, zip].filter(Boolean).join(', ')

  // Keyboard support for lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % photos.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen, photos.length])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const selectThumbnail = useCallback((index: number) => {
    setFeaturedIndex(index)
  }, [])

  // Track photo click
  const trackPhotoClick = useCallback((index: number) => {
    try {
      const payload = JSON.stringify({
        checkInId,
        eventType: 'PHOTO_CLICK',
        metadata: JSON.stringify({ photoIndex: index, photoUrl: photos[index] }),
      })
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/checkins/events', blob)
      } else {
        fetch('/api/checkins/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {}
  }, [checkInId, photos])

  const handlePhotoClick = useCallback((index: number) => {
    trackPhotoClick(index)
    openLightbox(index)
  }, [trackPhotoClick, openLightbox])

  return (
    <>
      {/* ============================================
          SECTION A: Dark Header Band
          ============================================ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0f1f17 0%, #0a1610 40%, #080e0b 100%)',
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundImage: NOISE_BG, backgroundSize: '200px 200px', opacity: 0.035 }}
        />
        {/* Diagonal pattern */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            opacity: 0.025,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
          }}
        />

        {/* Top bar */}
        <div className="relative z-[5] max-w-[76rem] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {orgSlug && (
              <Link
                href={`/portfolio/${orgSlug}`}
                className="inline-flex items-center gap-1 text-white/60 hover:text-white text-[0.8rem] transition-colors duration-200 shrink-0 min-h-0 min-w-0"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Portfolio</span>
              </Link>
            )}
            <span className="font-display font-bold text-[0.95rem] text-white tracking-tight truncate">
              {businessName}
            </span>
          </div>
          {businessPhone && (
            <JobPhoneLink
              checkInId={checkInId}
              href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`}
              label="Get a Free Estimate"
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-[0.8rem] px-4 py-1.5 rounded-md min-h-[36px] transition-all duration-200 shrink-0"
            />
          )}
        </div>

        {/* ============================================
            SECTION B: Photo Gallery
            ============================================ */}
        <div className="relative z-[5] max-w-[76rem] mx-auto px-5 sm:px-8 pb-6">
          {photos.length === 0 ? (
            /* No photos placeholder */
            <div
              className="w-full rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                height: 'min(60vh, 500px)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-center">
                <ImagePlaceholderIcon className="w-16 h-16 text-white/15 mx-auto" />
                <p className="mt-3 text-white/30 text-sm">No photos available</p>
              </div>
            </div>
          ) : (
            <>
              {/* Featured photo */}
              <button
                onClick={() => handlePhotoClick(featuredIndex)}
                className="w-full rounded-xl overflow-hidden cursor-pointer block relative group"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                type="button"
                aria-label="Open photo lightbox"
              >
                <div className="relative" style={{ height: 'min(60vh, 500px)' }}>
                  <Image
                    src={photos[featuredIndex]}
                    alt={`${doorType} installation in ${city}, ${state} - photo ${featuredIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 76rem"
                    priority
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur-sm">
                      View all photos ({photos.length})
                    </span>
                  </div>
                </div>
              </button>

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div
                  ref={thumbnailStripRef}
                  className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => selectThumbnail(i)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        i === featuredIndex
                          ? 'ring-2 ring-amber-400 opacity-100'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                      style={{ scrollSnapAlign: 'start' }}
                      type="button"
                      aria-label={`View photo ${i + 1}`}
                    >
                      <Image
                        src={url}
                        alt={`${doorType} installation in ${city}, ${state} - thumbnail ${i + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ============================================
          SECTION C: Job Details (lighter background)
          ============================================ */}
      <JobDetailsSection
        title={title}
        doorType={doorType}
        fullLocation={fullLocation}
        location={location}
        timestamp={timestamp}
        notes={notes}
        checkInId={checkInId}
        businessName={businessName}
        businessPhone={businessPhone}
        normalizedWebsite={normalizedWebsite}
      />

      {/* ============================================
          SECTION D: Related Projects
          ============================================ */}
      {relatedJobs.length > 0 && (
        <RelatedProjectsSection
          relatedJobs={relatedJobs}
          businessName={businessName}
          orgSlug={orgSlug}
        />
      )}

      {/* ============================================
          SECTION E: CTA Band
          ============================================ */}
      {(businessPhone || normalizedWebsite) && (
        <CtaBand
          checkInId={checkInId}
          businessName={businessName}
          businessPhone={businessPhone}
          normalizedWebsite={normalizedWebsite}
        />
      )}

      {/* ============================================
          SECTION F: Footer
          ============================================ */}
      <footer className="bg-surface-50 border-t border-surface-200 text-center py-5 px-4">
        <p className="text-xs text-surface-500">
          Powered by{' '}
          <a
            href={baseUrl || '/'}
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
            Jobsite Check-In
          </a>
        </p>
        <p className="text-[0.68rem] text-surface-400 mt-0.5">
          Automatic portfolios for service businesses
        </p>
      </footer>

      {/* ============================================
          LIGHTBOX OVERLAY
          ============================================ */}
      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          doorType={doorType}
          city={city}
          state={state}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)}
          onNext={() => setLightboxIndex((prev) => (prev + 1) % photos.length)}
          onGoTo={(i) => setLightboxIndex(i)}
        />
      )}
    </>
  )
}

/* ===================================================================
   SECTION C: JOB DETAILS
   =================================================================== */

function JobDetailsSection({
  title,
  doorType,
  fullLocation,
  location,
  timestamp,
  notes,
  checkInId,
  businessName,
  businessPhone,
  normalizedWebsite,
}: {
  title: string
  doorType: string
  fullLocation: string
  location: string
  timestamp: string | null
  notes: string | null
  checkInId: string
  businessName: string
  businessPhone: string
  normalizedWebsite: string
}) {
  const { ref, inView } = useInView()

  return (
    <section className="bg-surface-50 py-10 md:py-14">
      <div
        ref={ref}
        className={`max-w-[76rem] mx-auto px-5 sm:px-8 transition-all duration-600 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left column: details */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] font-bold text-surface-900 tracking-tight leading-[1.1]">
              {title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
              {location && (
                <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-surface-600">
                  <MapPinIcon className="w-4 h-4 text-primary-500" />
                  {fullLocation}
                </span>
              )}
              {timestamp && (
                <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-surface-600">
                  <CalendarIcon className="w-4 h-4 text-primary-500" />
                  {formatDate(timestamp)}
                </span>
              )}
            </div>

            {/* Service type badge */}
            {doorType && (
              <div className="mt-5">
                <span className="inline-block text-[0.72rem] font-bold text-primary-700 uppercase tracking-wide px-3 py-1 rounded-full bg-primary-50 border border-primary-100">
                  {doorType}
                </span>
              </div>
            )}

            {/* About This Project */}
            {notes && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-semibold text-surface-800 mb-3">
                  About This Project
                </h2>
                <div
                  className="pl-4 py-3 text-[0.9rem] text-surface-700 leading-relaxed"
                  style={{
                    borderLeft: '3px solid',
                    borderImage: 'linear-gradient(to bottom, #e8a83a, #d4912a) 1',
                  }}
                >
                  {notes}
                </div>
              </div>
            )}
          </div>

          {/* Right column: contact card */}
          <div className="lg:w-[340px] shrink-0">
            <div
              className="lg:sticky lg:top-24 rounded-xl p-6"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <p className="font-display font-bold text-surface-900 text-lg">
                {businessName}
              </p>
              <p className="text-[0.82rem] text-surface-500 mt-1">
                Professional door installation
              </p>

              <div className="mt-5 space-y-2.5">
                {businessPhone && (
                  <JobPhoneLink
                    checkInId={checkInId}
                    href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`}
                    label="Get a Free Estimate"
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-3 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
                  />
                )}
                {businessPhone && (
                  <JobPhoneLink
                    checkInId={checkInId}
                    href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`}
                    label={businessPhone}
                    className="w-full inline-flex items-center justify-center gap-2 text-surface-700 font-medium px-5 py-2.5 rounded-lg text-[0.85rem] min-h-[44px] transition-all duration-200 border border-surface-200 hover:border-primary-300 hover:text-primary-700"
                  />
                )}
                {normalizedWebsite && (
                  <JobWebsiteLink
                    checkInId={checkInId}
                    href={normalizedWebsite}
                    label="Visit Website"
                    className="w-full inline-flex items-center justify-center gap-2 text-surface-700 font-medium px-5 py-2.5 rounded-lg text-[0.85rem] min-h-[44px] transition-all duration-200 border border-surface-200 hover:border-primary-300 hover:text-primary-700"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ===================================================================
   SECTION D: RELATED PROJECTS
   =================================================================== */

function RelatedProjectsSection({
  relatedJobs,
  businessName,
  orgSlug,
}: {
  relatedJobs: RelatedJob[]
  businessName: string
  orgSlug: string | null
}) {
  const { ref, inView } = useInView()

  return (
    <section className="bg-surface-50 border-t border-surface-200 py-10 md:py-14">
      <div
        ref={ref}
        className={`max-w-[76rem] mx-auto px-5 sm:px-8 transition-all duration-600 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-xl font-bold text-surface-900">
            More Projects by {businessName}
          </h2>
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(to right, rgba(212,145,42,0.4), transparent)' }}
          />
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatedJobs.map((job, i) => (
            <RelatedJobCard key={job.id} job={job} index={i} />
          ))}
        </div>

        {/* View Full Portfolio link */}
        {orgSlug && (
          <div className="mt-8 text-center">
            <Link
              href={`/portfolio/${orgSlug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:text-primary-500 text-[0.9rem] transition-colors duration-200 min-h-0 min-w-0"
            >
              View Full Portfolio
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function RelatedJobCard({ job, index }: { job: RelatedJob; index: number }) {
  const { ref, inView } = useInView()

  return (
    <Link
      href={job.jobPath}
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={`group block bg-white rounded-xl overflow-hidden border border-surface-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      {/* Gold accent line on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to right, #e8a83a, #b87420, transparent)' }}
      />

      <div className="aspect-[16/10] bg-surface-100 overflow-hidden relative">
        {job.thumbnail ? (
          <Image
            src={job.thumbnail}
            alt={`${job.doorType} in ${job.city}, ${job.state}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <ImagePlaceholderIcon className="w-10 h-10 text-surface-300" />
          </div>
        )}
      </div>

      <div className="px-4 py-3.5">
        <span className="inline-block text-[0.68rem] font-bold text-primary-700 uppercase tracking-wide px-2 py-0.5 rounded bg-primary-50 border border-primary-100">
          {job.doorType}
        </span>
        <div className="mt-2 font-display text-[0.9rem] font-semibold text-surface-900 leading-tight group-hover:text-primary-600 transition-colors duration-200">
          {job.doorType} in {[job.city, job.state].filter(Boolean).join(', ')}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[0.72rem] text-surface-500">
          <span>{[job.city, job.state].filter(Boolean).join(', ')}</span>
          {job.timestamp && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-surface-400" />
              <span>{formatDate(job.timestamp)}</span>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 mt-2 text-[0.76rem] font-semibold text-primary-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
          View project &rarr;
        </span>
      </div>
    </Link>
  )
}

/* ===================================================================
   CTA BAND
   =================================================================== */

function CtaBand({
  checkInId,
  businessName,
  businessPhone,
  normalizedWebsite,
}: {
  checkInId: string
  businessName: string
  businessPhone: string
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
          Need a door installed?
        </h2>
        <p className="mt-2 text-white/60 text-[0.92rem]">
          Get a free estimate from {businessName}.
        </p>
        <div className="flex justify-center gap-2.5 mt-6 flex-wrap">
          {businessPhone && (
            <JobPhoneLink
              checkInId={checkInId}
              href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`}
              label="Get a Free Estimate"
              className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
            />
          )}
          {normalizedWebsite && (
            <JobWebsiteLink
              checkInId={checkInId}
              href={normalizedWebsite}
              label="Visit Website"
              className="inline-flex items-center gap-1.5 text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px] hover:-translate-y-px transition-all duration-200"
            />
          )}
        </div>
      </div>
    </section>
  )
}

/* ===================================================================
   LIGHTBOX
   =================================================================== */

function Lightbox({
  photos,
  currentIndex,
  doorType,
  city,
  state,
  onClose,
  onPrev,
  onNext,
  onGoTo,
}: {
  photos: string[]
  currentIndex: number
  doorType: string
  city: string
  state: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onGoTo: (i: number) => void
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        aria-label="Close lightbox"
        type="button"
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      {/* Photo counter */}
      <div className="absolute top-4 left-4 z-[110] text-white/60 text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Previous button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-3 sm:left-5 z-[110] w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
          aria-label="Previous photo"
          type="button"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Next button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-3 sm:right-5 z-[110] w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
          aria-label="Next photo"
          type="button"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      )}

      {/* Main image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[currentIndex]}
          alt={`${doorType} installation in ${city}, ${state} - photo ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[110] flex gap-1.5 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={`h-[7px] rounded-full cursor-pointer transition-all duration-300 ${
                i === currentIndex
                  ? 'w-5 bg-amber-400 shadow-[0_0_6px_rgba(212,145,42,0.4)]'
                  : 'w-[7px] bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to photo ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  )
}
