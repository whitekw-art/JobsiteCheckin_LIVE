export const geocodeJobAddress = async (
  jobAddress: string
): Promise<{ lat: number; lng: number } | null> => {
  const trimmed = jobAddress.trim()
  if (!trimmed) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lat, lng }
      }
    }
  } catch {
    return null
  }
  return null
}
