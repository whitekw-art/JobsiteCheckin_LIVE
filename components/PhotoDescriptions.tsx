'use client'

import { useState } from 'react'
import { ALT_MAX_WORDS, altWithinLimits, altWordCount, cleanAltText, parseAltMap, photoAlt } from '@/lib/photoAlt'

// Photo descriptions (alt text) on the Job Dashboard (phase 3, part E). Built to
// the approved mockup docs/mockups/2026-10-14-photo-descriptions-mockup.html.
// Titan only, next to the Generate description with AI button.

export interface DescribedJob {
  id: string
  doorType?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  photoUrls?: string[]
  beforePhotoUrl?: string | null
  afterPhotoUrl?: string | null
  photoAltText?: unknown
}

type Values = Record<string, string>

const roleOf = (job: DescribedJob, url: string): 'BEFORE' | 'AFTER' | null =>
  url === job.beforePhotoUrl ? 'BEFORE' : url === job.afterPhotoUrl ? 'AFTER' : null

/** The saved descriptions for a job, as an editable { photo address: text } map. */
export function savedDescriptions(job: DescribedJob): Values {
  return parseAltMap(job.photoAltText)
}

/** True when every non-empty description fits the limits (25 words). */
export function descriptionsValid(values: Values): boolean {
  return Object.values(values).every((v) => !cleanAltText(v) || altWithinLimits(v))
}

/** Only the descriptions with text, cleaned: what is sent to the server on Save. */
export function descriptionsToSave(values: Values): Values {
  const out: Values = {}
  for (const [url, text] of Object.entries(values)) {
    const t = cleanAltText(text)
    if (t) out[url] = t
  }
  return out
}

export function PhotoDescriptionEditor({
  job,
  values,
  onChange,
  tooLong,
  disabled,
}: {
  job: DescribedJob
  values: Values
  onChange: (url: string, text: string) => void
  /** Photos the AI was asked to describe but returned nothing usable for (too long, too unclear or rejected). */
  tooLong: Set<string>
  disabled?: boolean
}) {
  const photos = job.photoUrls ?? []
  return (
    <div className="pd-editor">
      {photos.map((url, i) => {
        const text = values[url] ?? ''
        const words = altWordCount(text)
        const over = words > ALT_MAX_WORDS
        const role = roleOf(job, url)
        return (
          <div key={url} className="pd-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pd-thumb" src={url} alt="" />
            <div className="pd-col">
              <div className="pd-name">
                Photo {i + 1} {role && <span className="pd-role">{role}</span>}
              </div>
              <input
                type="text"
                className="pd-input"
                value={text}
                disabled={disabled}
                placeholder="No description written. The plain description is used."
                aria-label={`Description of photo ${i + 1}`}
                onChange={(e) => onChange(url, e.target.value)}
              />
              {over ? (
                <div className="pd-count pd-over">
                  {words} of {ALT_MAX_WORDS} words. Shorten it to {ALT_MAX_WORDS} words or fewer to save.
                </div>
              ) : tooLong.has(url) && !text ? (
                <div className="pd-count">The AI did not write a usable description for this photo. Type your own, or leave this empty.</div>
              ) : text ? (
                <div className="pd-count">
                  {words} of {ALT_MAX_WORDS} words
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
      <p className="pd-hint">
        Check each description against its photo, because the AI reads a reduced-size copy. The before and after labels are added
        automatically. Never type a customer&apos;s name, a house number or a license plate.
      </p>
    </div>
  )
}

/** The saved descriptions below a job's notes: collapsed by default, with Edit (State 4). */
export function PhotoDescriptionsSection({
  job,
  editing,
  values,
  onChange,
  onEdit,
  onSave,
  onCancel,
  saving,
  error,
}: {
  job: DescribedJob
  editing: boolean
  values: Values
  onChange: (url: string, text: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  const [open, setOpen] = useState(false)
  const photos = job.photoUrls ?? []
  if (photos.length === 0) return null
  const saved = savedDescriptions(job)
  const written = photos.filter((u) => saved[u]).length
  const isOpen = open || editing

  return (
    <div className="pd-section">
      <button type="button" className="pd-toggle" aria-expanded={isOpen} onClick={() => setOpen((v) => !v)}>
        <span>Photo descriptions</span>
        <span className="pd-sub">
          {written} of {photos.length} written
        </span>
        <span className="pd-chev" aria-hidden="true">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>
      {isOpen && (
        <div className="pd-body">
          {editing ? (
            <>
              <PhotoDescriptionEditor job={job} values={values} onChange={onChange} tooLong={new Set()} disabled={saving} />
              {error && <div className="pd-error">{error}</div>}
              <div className="pd-actions">
                <button type="button" className="db-btn-save" disabled={saving || !descriptionsValid(values)} onClick={onSave}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="db-btn-cancel" disabled={saving} onClick={onCancel}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {photos.map((url, i) => {
                const role = roleOf(job, url)
                return (
                  <div key={url} className="pd-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="pd-thumb" src={url} alt="" />
                    <div className="pd-col">
                      <div className="pd-name">
                        Photo {i + 1} {role && <span className="pd-role">{role}</span>}
                      </div>
                      {saved[url] ? (
                        <div className="pd-text">{saved[url]}</div>
                      ) : (
                        <div className="pd-fallback">
                          {photoAlt({ ...job, photoAltText: null }, url, i, photos.length)} (plain description, used because none is
                          written)
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="pd-actions">
                <button type="button" className="rv-btn-text" onClick={onEdit}>
                  Edit photo descriptions
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
