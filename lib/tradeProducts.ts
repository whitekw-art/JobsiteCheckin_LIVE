/**
 * Trade → default product/service options for the check-in form.
 *
 * These are only ever used to SEED an organization's own editable list
 * (`Organization.productOptions`). Once seeded, the customer owns the list —
 * nothing here overwrites their edits unless they explicitly load defaults.
 *
 * "Other" is never stored in the list. It's appended by the check-in form as a
 * fixed escape hatch that reveals a free-text field.
 */

export const OTHER_OPTION = 'Other'

export const TRADES = [
  'Door Installation',
  'Garage Door',
  'Fence Installation',
  'Pest Control',
  'Landscaping',
  'Painting',
  'Pressure Washing',
  'Roofing',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Flooring',
  'Moving Company',
  'Mobile Auto Detailing',
  'General Contractor',
  'Other',
] as const

export type Trade = (typeof TRADES)[number]

export const TRADE_PRODUCTS: Record<string, string[]> = {
  // Unchanged from the original hardcoded check-in list, so existing
  // door customers see exactly what they saw before.
  'Door Installation': [
    'Wood Door',
    'Iron Door',
    'Fiberglass Front Door',
    'Fiberglass Back / Patio Door',
    'Barn Door',
  ],
  'Garage Door': [
    'Garage Door Installation',
    'Garage Door Repair',
    'Opener Installation',
    'Opener Repair',
    'Spring Replacement',
    'Panel Replacement',
  ],
  'Fence Installation': [
    'Wood Fence',
    'Vinyl Fence',
    'Aluminum Fence',
    'Chain Link Fence',
    'Gate Installation',
    'Fence Repair',
  ],
  'Pest Control': [
    'General Pest Control (Quarterly)',
    'Termite Inspection',
    'Termite Treatment',
    'Mosquito Treatment',
    'Rodent Exclusion',
    'Bed Bug Treatment',
    'Wildlife Removal',
  ],
  Landscaping: [
    'Lawn Maintenance',
    'Landscape Design',
    'Sod Installation',
    'Mulch Installation',
    'Tree & Shrub Trimming',
    'Irrigation Installation',
    'Hardscape / Patio',
    'Retaining Wall',
  ],
  Painting: [
    'Interior Painting',
    'Exterior Painting',
    'Cabinet Refinishing',
    'Deck & Fence Staining',
    'Drywall Repair',
    'Commercial Painting',
  ],
  'Pressure Washing': [
    'House Wash',
    'Driveway & Concrete Cleaning',
    'Roof Soft Wash',
    'Deck & Patio Cleaning',
    'Gutter Cleaning',
    'Commercial Pressure Washing',
  ],
  Roofing: [
    'Shingle Roof Replacement',
    'Metal Roof Installation',
    'Roof Repair',
    'Storm Damage Repair',
    'Gutter Installation',
    'Skylight Installation',
  ],
  HVAC: [
    'AC Installation',
    'AC Repair',
    'Furnace Installation',
    'Furnace Repair',
    'Heat Pump Installation',
    'Ductwork',
    'Maintenance / Tune-Up',
  ],
  Plumbing: [
    'Water Heater Installation',
    'Water Heater Repair',
    'Drain Cleaning',
    'Leak Repair',
    'Repipe',
    'Fixture Installation',
    'Sewer Line Repair',
  ],
  Electrical: [
    'Panel Upgrade',
    'Outlet & Switch Installation',
    'Lighting Installation',
    'Ceiling Fan Installation',
    'EV Charger Installation',
    'Generator Installation',
    'Rewiring',
  ],
  Flooring: [
    'Hardwood Installation',
    'Luxury Vinyl Plank',
    'Tile Installation',
    'Carpet Installation',
    'Laminate Installation',
    'Floor Refinishing',
  ],
  'Moving Company': [
    'Local Move',
    'Long Distance Move',
    'Packing Services',
    'Loading / Unloading',
    'Storage',
    'Commercial Move',
  ],
  'Mobile Auto Detailing': [
    'Full Detail',
    'Interior Detail',
    'Exterior Detail',
    'Ceramic Coating',
    'Paint Correction',
    'Headlight Restoration',
  ],
  'General Contractor': [
    'Kitchen Remodel',
    'Bathroom Remodel',
    'Room Addition',
    'Deck Construction',
    'Basement Finishing',
    'Window Replacement',
  ],
  Other: [],
}

/** Default product list for a trade. Unknown/unset trade yields an empty list. */
export function defaultProductsForTrade(trade?: string | null): string[] {
  if (!trade) return []
  return [...(TRADE_PRODUCTS[trade] ?? [])]
}

/**
 * Normalizes whatever is stored in `Organization.productOptions` (Json) into a
 * clean string array — trimmed, de-duplicated (case-insensitive), non-empty,
 * with any stored "Other" stripped since the form always appends its own.
 */
export function normalizeProductOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const value = item.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (key === OTHER_OPTION.toLowerCase()) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out.slice(0, MAX_PRODUCT_OPTIONS)
}

/** Guard against unbounded growth of a customer-editable list. */
export const MAX_PRODUCT_OPTIONS = 100
