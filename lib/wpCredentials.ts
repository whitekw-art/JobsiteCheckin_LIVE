import crypto from 'crypto'

// Encryption for customer-supplied WordPress Application Passwords.
//
// This is the only place in the app that stores a per-customer secret in the
// database, so it gets real encryption rather than plaintext. AES-256-GCM
// (authenticated) — tampering with stored ciphertext fails decryption instead
// of silently returning garbage.
//
// Required env:
//   WP_CREDENTIAL_ENCRYPTION_KEY — 64-char hex (32 bytes) preferred; any other
//   string is derived to 32 bytes via SHA-256. Generate with:
//     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// Never commit the key. Set it in Vercel env vars (staging + production), the
// same way CRON_SECRET and VERCEL_TOKEN are handled.

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12 // GCM standard
const PREFIX = 'v1' // versioned so the scheme can be rotated later

function getKey(): Buffer | null {
  const raw = process.env.WP_CREDENTIAL_ENCRYPTION_KEY
  if (!raw) return null
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex')
  return crypto.createHash('sha256').update(raw).digest()
}

/** True when the app is configured to store WordPress credentials at all. */
export function encryptionConfigured(): boolean {
  return getKey() !== null
}

/**
 * Encrypt a credential for storage. Returns null when no key is configured —
 * callers must treat that as "refuse to save", never as "store plaintext".
 */
export function encryptCredential(plaintext: string): string | null {
  const key = getKey()
  if (!key) return null
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.')
}

/**
 * Decrypt a stored credential. Returns null on any failure (missing key,
 * malformed value, wrong key, tampered ciphertext) — callers should surface
 * that as a broken connection needing reconnection, not crash.
 */
export function decryptCredential(stored: string | null | undefined): string | null {
  if (!stored) return null
  const key = getKey()
  if (!key) return null
  const parts = stored.split('.')
  if (parts.length !== 4 || parts[0] !== PREFIX) return null
  try {
    const [, ivB64, tagB64, ctB64] = parts
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ])
    return pt.toString('utf8')
  } catch {
    return null
  }
}
