/**
 * Fake jobs used only by the Job Dashboard tutorial.
 *
 * A brand new account has nothing on its dashboard, so a tour of the rows,
 * the expanded detail and the action buttons would have nothing to point at.
 * These render through the real dashboard components on /dashboard?tutorial=1
 * and nowhere else.
 *
 * Every value here is deliberately and visibly fake. Nothing is copied from a
 * real account, and the ids are prefixed so they can never collide with or be
 * mistaken for a real record. The photos are sample product shots kept in
 * public/demo-jobs/ for this purpose.
 */
export interface DemoJob {
  id: string
  timestamp: string
  installer: string
  street: string
  city: string
  state: string
  zip: string
  notes: string
  doorType: string
  isPublic: boolean
  photoUrls: string[]
  featuredPhotoUrl: string | null
  homeCustomerName: string
  homeCustomerPhone: string
  homeCustomerEmail: string
  latitude: null
  longitude: null
  locationSource: null
  gbpPostUrl: null
  gbpPostedAt: null
  gbpPostStatus: null
}

export const DEMO_JOB_ID_PREFIX = 'demo-'

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'demo-draft',
    timestamp: '2026-05-24T15:30:00.000Z',
    installer: 'Sample Installer',
    street: '123 Example Street',
    city: 'Sample City',
    state: 'GA',
    zip: '00000',
    doorType: 'Wood Door',
    notes: 'Example job. Installed a wood front door with custom glass panes and matching hardware.',
    isPublic: false,
    photoUrls: ['/demo-jobs/demo-door-2.jpg'],
    featuredPhotoUrl: null,
    homeCustomerName: 'Sample Customer',
    homeCustomerPhone: '(555) 000-0000',
    homeCustomerEmail: 'customer@example.com',
    latitude: null,
    longitude: null,
    locationSource: null,
    gbpPostUrl: null,
    gbpPostedAt: null,
    gbpPostStatus: null,
  },
  {
    id: 'demo-live',
    timestamp: '2026-04-16T14:00:00.000Z',
    installer: 'Sample Installer',
    street: '456 Demo Avenue',
    city: 'Example Town',
    state: 'AL',
    zip: '00000',
    doorType: 'Iron Door',
    notes: 'Example job. Installed wrought iron front doors with large custom glass panes for a family in Example Town.',
    isPublic: true,
    photoUrls: [
      '/demo-jobs/demo-door-1.jpg',
      '/demo-jobs/demo-door-3.jpg',
      '/demo-jobs/demo-door-4.jpg',
    ],
    featuredPhotoUrl: '/demo-jobs/demo-door-1.jpg',
    homeCustomerName: 'Example Homeowner',
    homeCustomerPhone: '(555) 000-0000',
    homeCustomerEmail: 'homeowner@example.com',
    latitude: null,
    longitude: null,
    locationSource: null,
    gbpPostUrl: null,
    gbpPostedAt: null,
    gbpPostStatus: null,
  },
]

export function isDemoJob(id: string): boolean {
  return id.startsWith(DEMO_JOB_ID_PREFIX)
}
