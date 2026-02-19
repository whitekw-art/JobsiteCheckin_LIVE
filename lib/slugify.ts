/**
 * Convert a string to a URL-friendly slug.
 * Lowercases, replaces slashes and non-alphanumerics with hyphens, trims leading/trailing hyphens.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\/]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
