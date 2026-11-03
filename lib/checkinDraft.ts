// Unsubmitted New Check-In drafts, saved on the person's own device (browser
// IndexedDB) so nothing typed or photographed is lost when they are signed out
// (the 30-minute idle limit), close the app or lose signal. Each draft belongs
// to one signed-in user, so a second person signing in on the same phone never
// sees it. Nothing here touches the server. Every function fails quietly: if
// the browser cannot store the draft (private browsing, storage full), the
// form keeps working as it always has.

const DB_NAME = 'pck-checkin-drafts'
const STORE = 'drafts'
const VERSION = 1

export interface DraftPhoto {
  file: File
  tag: null | 'before' | 'after'
}

export interface CheckInDraft {
  v: 1
  savedAt: number
  installer: string
  street: string
  city: string
  state: string
  zip: string
  doorType: string
  isOtherProduct: boolean
  notes: string
  homeCustomerName: string
  homeCustomerPhone: string
  homeCustomerEmail: string
  photoLocation: { lat: number; lng: number } | null
  photos: DraftPhoto[]
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const tx = db.transaction(STORE, mode)
          const req = fn(tx.objectStore(STORE))
          tx.oncomplete = () => {
            db.close()
            resolve((req.result as T) ?? null)
          }
          tx.onerror = tx.onabort = () => {
            db.close()
            resolve(null)
          }
        } catch {
          db.close()
          resolve(null)
        }
      })
  )
}

// Two records per user: the text (rewritten on every pause in typing) and the
// photos (rewritten only when the photos or their tags change), so typing never
// rewrites several megabytes of photos.
const textKey = (userId: string) => `${userId}:text`
const photosKey = (userId: string) => `${userId}:photos`

export type DraftText = Omit<CheckInDraft, 'photos'>

export async function loadCheckInDraft(userId: string): Promise<CheckInDraft | null> {
  const text = await run<DraftText>('readonly', (s) => s.get(textKey(userId)) as IDBRequest<DraftText>)
  if (!text || text.v !== 1) return null
  const photos = await run<DraftPhoto[]>('readonly', (s) => s.get(photosKey(userId)) as IDBRequest<DraftPhoto[]>)
  return { ...text, photos: Array.isArray(photos) ? photos : [] }
}

export async function saveDraftText(userId: string, text: DraftText): Promise<void> {
  await run('readwrite', (s) => s.put(text, textKey(userId)))
}

/** Photos are stored as File objects; the browser keeps their bytes on the device. */
export async function saveDraftPhotos(userId: string, photos: DraftPhoto[]): Promise<void> {
  await run('readwrite', (s) => s.put(photos, photosKey(userId)))
}

export async function deleteCheckInDraft(userId: string): Promise<void> {
  await run('readwrite', (s) => s.delete(textKey(userId)))
  await run('readwrite', (s) => s.delete(photosKey(userId)))
}

/** True when the draft holds anything worth keeping. */
export function draftHasContent(d: Omit<CheckInDraft, 'v' | 'savedAt'>, installerIsAutomatic: boolean): boolean {
  const text = [d.street, d.city, d.state, d.zip, d.doorType, d.notes, d.homeCustomerName, d.homeCustomerPhone, d.homeCustomerEmail]
  if (!installerIsAutomatic) text.push(d.installer)
  return d.photos.length > 0 || text.some((t) => (t || '').trim() !== '')
}
