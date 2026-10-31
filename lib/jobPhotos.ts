import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// One set of rules for changing a job's photos, shared by Edit Check-In and the
// Job Dashboard's photo X button, so both clear a removed photo's BEFORE/AFTER
// tag and cover choice, both enforce "every published job keeps a photo", and
// both delete the removed file from storage. Before 2026-10-11 the dashboard X
// left the tag pointing at a deleted photo and the file publicly reachable.

export const LAST_PHOTO_ERROR = 'Every published job must contain at least 1 photo.'

export interface JobPhotoState {
  photoUrls: string[]
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
  featuredPhotoUrl: string | null
}

export function splitPhotoUrls(value: string | null | undefined): string[] {
  return value ? value.split(',').map((u) => u.trim()).filter(Boolean) : []
}

/**
 * Apply removals, additions and tag choices to a job's photos.
 * - `remove` must be photos currently on the job.
 * - `before` / `after`: undefined keeps the saved tag; null clears it; a URL
 *   sets it and must be one of the job's photos after the change. One photo
 *   per tag, and a photo cannot be both BEFORE and AFTER.
 * - A removed photo loses its tag and stops being the cover photo.
 */
export function applyPhotoChanges(
  current: JobPhotoState,
  change: { remove?: string[]; append?: string[]; before?: string | null; after?: string | null }
): { ok: true; next: JobPhotoState; removed: string[] } | { ok: false; error: string } {
  const remove = [...new Set(change.remove ?? [])]
  const notOnJob = remove.filter((u) => !current.photoUrls.includes(u))
  if (notOnJob.length) return { ok: false, error: 'A photo to remove is not part of this job.' }

  const kept = current.photoUrls.filter((u) => !remove.includes(u))
  const photoUrls = [...kept, ...(change.append ?? []).filter((u) => !kept.includes(u))]

  // An untouched tag is kept as saved unless its photo is being removed now.
  // (Checking membership here instead would silently wipe a legacy tag whose
  // photo was never listed in photoUrls, on an unrelated save such as notes.)
  const resolveTag = (requested: string | null | undefined, saved: string | null): string | null | 'invalid' => {
    if (requested === undefined) return saved && !remove.includes(saved) ? saved : null
    if (requested === null) return null
    if (requested === saved && !remove.includes(saved)) return requested
    return photoUrls.includes(requested) ? requested : 'invalid'
  }
  const before = resolveTag(change.before, current.beforePhotoUrl)
  const after = resolveTag(change.after, current.afterPhotoUrl)
  if (before === 'invalid' || after === 'invalid') {
    return { ok: false, error: 'A BEFORE or AFTER photo must be one of this job’s photos.' }
  }
  if (before && after && before === after) {
    return { ok: false, error: 'One photo cannot be both BEFORE and AFTER.' }
  }

  return {
    ok: true,
    removed: remove,
    next: {
      photoUrls,
      beforePhotoUrl: before,
      afterPhotoUrl: after,
      featuredPhotoUrl:
        current.featuredPhotoUrl && !remove.includes(current.featuredPhotoUrl) ? current.featuredPhotoUrl : null,
    },
  }
}

const STORAGE_MARKER = '/storage/v1/object/public/checkin-photos/'

/** The object's canonical path in the bucket, or null for anything unusual. */
function storagePath(url: string): string | null {
  const i = url.indexOf(STORAGE_MARKER)
  if (i === -1) return null
  const raw = url.slice(i + STORAGE_MARKER.length)
  // Upload paths are plain file names such as jobsite-1785067786866.jpg. Any
  // query string, fragment, encoding or folder makes the URL a variant that
  // could alias another object, so it is never deleted.
  if (!/^[A-Za-z0-9._-]+$/.test(raw)) return null
  return raw
}

/**
 * Permanently delete removed photo files from storage. A file is deleted only
 * when (1) the caller's organization uploaded it, proven by its row in the
 * Photo table, and (2) no job anywhere still references that object path.
 * Both checks use the canonical path, so a URL variant (for example with a
 * query string) can never be used to delete another organization's file.
 * Files uploaded before the Photo table existed have no row and are left in
 * place. Best-effort: a failure is logged and never undoes the edit.
 */
export async function deleteStoredPhotos(urls: string[], organizationId: string): Promise<void> {
  if (urls.length === 0 || !organizationId) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const paths: string[] = []
  for (const u of urls) {
    const path = storagePath(u)
    if (!path || paths.includes(path)) continue

    const ownedByCaller = await prisma.photo.count({ where: { filename: path, orgId: organizationId } })
    if (ownedByCaller === 0) continue

    const marker = `${STORAGE_MARKER}${path}`
    const stillUsed = await prisma.checkIn.count({
      where: {
        OR: [
          { photoUrls: { contains: marker } },
          { beforePhotoUrl: { contains: marker } },
          { afterPhotoUrl: { contains: marker } },
          { featuredPhotoUrl: { contains: marker } },
        ],
      },
    })
    if (stillUsed === 0) paths.push(path)
  }
  if (paths.length === 0) return

  try {
    const supabase = createClient(url, key)
    const { error } = await supabase.storage.from('checkin-photos').remove(paths)
    if (error) console.error('Could not delete removed photos from storage:', error)
  } catch (err) {
    console.error('Could not delete removed photos from storage:', err)
  }
}
