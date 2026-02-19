# Jobsite Check-In — Project Context

## What This Is
A mobile-friendly Next.js SaaS app for field service businesses (door installers). Field workers submit job completion check-ins with photos and GPS data; business owners monitor work from an admin dashboard. Published check-ins become SEO-optimized public portfolio pages for local marketing.

## Rules
- NEVER expose personal PII (full customer names, phone numbers, emails, SSNs) in public URLs or metadata. Job addresses (street, city, state) are public data and OK to display on pages and in structured data — they improve local SEO. URLs should use city/state/service-type, not full street addresses.
- Test locally first. NEVER push to staging or production without explicit user confirmation.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL via Supabase, Prisma 6.19 ORM
- **Auth**: NextAuth.js 4.24 (credentials + email magic links, JWT sessions)
- **Photo Storage**: Supabase Storage (`checkin-photos` bucket)
- **Payments**: Stripe (Individual $199/yr, Business $299/yr)
- **Image Processing**: Sharp, heic-convert (HEIC→JPEG)
- **Legacy Support**: Google Sheets + Google Drive (optional, via googleapis SDK)
- **Deployment**: Vercel

## Project Structure
```
app/
  page.tsx                          # Home — redirects to signin
  layout.tsx                        # Root layout with Providers
  check-in/                         # Main check-in form (worker-facing)
  dashboard/                        # Admin dashboard (owner/admin-facing)
  reporting/                        # Business reporting & analytics
  jobs/[location]/[slug]/           # Public SEO job pages
  auth/                             # signin, register, forgot/reset password, invite
  payments/                         # Stripe checkout flow
  api/
    auth/[...nextauth]/             # NextAuth config (Prisma adapter, credentials+email providers)
    auth/register/                  # User + org creation
    auth/forgot-password/           # Password reset email
    auth/reset-password/            # Token validation + password update
    upload-photo/                   # Upload to Supabase Storage
    submit-checkin-supabase/        # Save check-in to PostgreSQL
    get-checkins-supabase/          # Fetch org check-ins
    download-photos/                # ZIP download of photos
    checkins/address/               # Update address & re-geocode
    checkins/photos/                # Manage check-in photos
    checkins/publish/               # Toggle public visibility
    checkins/events/                # Event tracking (views, clicks)
    organization/                   # Org profile management
    team/                           # Team members & invitations
    create-checkout-session/        # Stripe checkout
    stripe-webhook/                 # Stripe payment events
components/
  Navigation.tsx                    # Top nav bar
  Providers.tsx                     # Client-side providers wrapper
  CheckInPageViewTracker.tsx        # Analytics tracking
  ReportingJobTableBody.tsx         # Reporting table
  ReportingPhotoTableBody.tsx       # Photo reporting table
  JobPhoneLink.tsx / JobWebsiteLink.tsx / JobPhotoLink.tsx  # Click-tracked links
lib/
  prisma.ts                         # Prisma client singleton
  auth.ts / auth-helpers.ts         # Auth utilities
  geocode.ts                        # Address → coordinates (Google Geocoding API)
  google-auth.ts / drive-auth.ts    # Google API auth helpers
prisma/
  schema.prisma                     # Database models
  migrations/                       # Migration history
middleware.ts                       # Route protection & role-based redirects
types/
  next-auth.d.ts                    # NextAuth type extensions
```

## Database Models (prisma/schema.prisma)
- **Organization** — id, name, slug (unique), phone, website; has many Users, CheckIns, Invitations
- **User** — email, password (bcrypt), role (USER|ADMIN|OWNER|SUPER_ADMIN), belongs to Organization
- **CheckIn** — installer, street/city/state/zip, doorType, notes, latitude/longitude, locationSource (EXIF|ADDRESS|DEVICE), photoUrls (comma-separated), isPublic, seoTitle/seoDescription; belongs to Organization
- **CheckInEvent** — checkInId, eventType (page_view|phone_click|website_click), metadata (JSON)
- **Photo** — filename, url, checkInId
- **Account / Session / VerificationToken** — NextAuth standard models
- **PasswordResetToken** — userId, tokenHash, expiresAt, usedAt
- **Invitations** — org invitations with token-based acceptance

## Key Data Flows
1. **Check-in submission**: Photos upload to Supabase Storage → check-in record saved to PostgreSQL with photo URLs, GPS coords (from EXIF > geocode > device GPS fallback)
2. **Dashboard**: Fetches org check-ins, displays table with stats, supports photo management and address editing
3. **Public pages**: Published check-ins served at `/jobs/[city-state]/[slug]` with SEO metadata and click event tracking
4. **Auth**: NextAuth JWT sessions, middleware protects routes; USERs → `/check-in`, ADMIN/OWNER → `/dashboard`

## Environment Variables (see .env.local.example)
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, Supabase keys, Stripe keys, Google API credentials, email server config, NEXT_PUBLIC_APP_URL

## Build Commands
- `npm run dev` — Dev server on port 3000
- `npm run build` — `prisma generate && next build`
- `npm run start` — Production server

## Strategic Vision
Local SEO automation platform for field service businesses. Every job completed through the app automatically generates SEO value in TWO places: the contractor's own website (via embeddable widget) AND our platform (via public job pages). The app does NOT require blogging or manual content — job data IS the content. Primary goal: drive customer SEO/revenue. Secondary goal: grow our own platform SEO through their success.

## Pricing Tiers
- **Free (Starter)** — Job check-ins, photos, worker history, basic dashboard, 1 public job page, "Powered by" branding
- **Pro (~$49/mo)** — Unlimited public pages w/ full SEO, embeddable website widget, city/ZIP pages, portfolio page, basic analytics, remove branding option
- **Growth (~$99/mo)** — Auto-formatted GBP posts (AI-drafted), set-and-forget GBP cadence, post-job review requests (SMS/email), review tracking, before/after tagging, customer contact storage, KPI dashboard
- **Premium (~$199-299/mo)** — Geo-grid rank tracking (heatmap), NAP sync & listing health, CRM/QuickBooks integration, bulk photo management w/ AI captions, white-label widget, multi-location support, priority support

## Completed Features
- [x] **Installer History/Gallery** — `/my-jobs` route, card gallery, inline editing, 7-day edit window (DEPLOYED)
- [x] **Schema Markup** — JSON-LD (LocalBusiness + Service + ImageObject) on public job pages (DEPLOYED)
- [x] **Image Alt Text** — Descriptive alt from door type + city/state on public pages and OG images (DEPLOYED)
- [x] **Open Graph Tags** — og:title, og:image, og:description + Twitter cards on public pages (DEPLOYED)
- [x] **Parallel Testing Environment** — Staging + production on Vercel with separate Supabase instances (DONE)

## Feature Roadmap

### Build Phase A — SEO Foundation (Next)
Goal: Complete the SEO infrastructure on our domain so pages get indexed and rank.
- [x] **Sitemap.xml** — Auto-list all published job URLs; include only public jobs; serve at /sitemap.xml (DEPLOYED)
- [x] **Clean URL audit** — URL pattern `/jobs/{city}-{state}/{doorType}-{uuid}` verified as SEO-optimal and privacy-safe (DONE)
- [x] **Mobile responsive fixes** — Hamburger nav, card layout on dashboard, tap target fixes, form labels, responsive padding, viewport zoom (DEPLOYED)
- [x] **Public Company Portfolio Page** — `/portfolio/[org-slug]` listing all published jobs for a contractor (DEPLOYED — functional scaffolding, pending design/UX pass)
- [ ] **City/ZIP landing pages** — `/locations/[city-state]` auto-enriched when jobs are completed there (see City Pages Notes below)

### Build Phase A2 — Design & UX Overhaul
Goal: Establish a cohesive visual identity and professional look across all pages — especially public-facing surfaces — before building the embeddable widget that will live on customer websites.

**Why here:** The embeddable widget (Phase B) will be embedded on contractor websites and seen by their customers. It must look professional. Every public-facing feature built without a design foundation (portfolio page, job pages, city pages) will need rework later. Doing design now prevents compounding design debt.

#### Step 1: Research & Inspiration
- [ ] **Competitor audit** — Analyze 5-8 similar apps (Jobber, Housecall Pro, ServiceTitan, Thumbtack contractor profiles, Houzz pro pages, BuildBook, CompanyCam, GorillaDesk) — screenshot their portfolio/public pages, note layout patterns, information hierarchy, typography, color usage, mobile behavior
- [ ] **Best practices research** — Review SaaS landing page and portfolio design patterns from sources like Refactoring UI, Dribbble, Land-book, and SaaS Pages — focus on trust signals, visual hierarchy, whitespace usage, and CTA placement
- [ ] **Mood board** — Collect 10-15 screenshots/references that match the desired feel: clean, professional, trustworthy, simple. Organize by page type (portfolio, job detail, dashboard, nav)
- [ ] **Identify design principles** — Document 4-5 guiding principles for the app's visual identity (e.g., "contractor-grade trust", "mobile-first simplicity", "data speaks for itself")

#### Step 2: Design System Foundation
- [ ] **Color palette** — Define primary, secondary, accent, and neutral colors. Replace arbitrary Tailwind color classes (blue-600, green-600, purple-600) with intentional, consistent choices
- [ ] **Typography scale** — Define heading sizes, body text, captions, and labels with consistent sizing and weight
- [ ] **Spacing & layout rules** — Standardize padding, margins, card styles, border radii, and shadow depths across the app
- [ ] **Component inventory** — Catalog existing UI patterns (cards, buttons, stat blocks, nav items, tables, form fields) and define their canonical styles

#### Step 3: Public Pages Redesign
- [ ] **Portfolio page** — Redesign layout: consider grouped views (by city, by service type), better photo presentation, stronger business identity section, professional stats display, clear CTAs. Add interactive map with job pins (Google Maps / Mapbox) showing service area coverage. Determine best placement and information architecture.
- [ ] **Job detail page** — Redesign with better photo gallery, improved contact section, stronger trust signals
- [ ] **Navigation overhaul** — Evaluate current horizontal nav vs. sidebar, mobile hamburger behavior, information architecture for different user roles
- [ ] **City/ZIP landing pages** — Design these before building them (Phase A remaining item) so they launch looking polished

#### Step 4: Internal Pages Refresh
- [ ] **Dashboard** — Apply design system: cleaner stats cards, better table design, improved publish/edit UX, column filtering (by installer, city, door type, date range, publish status) so OWNER/ADMIN can slice data without needing a separate "My Jobs" view
- [ ] **Check-in form** — Apply consistent form styling
- [ ] **My Jobs gallery** — Apply card and grid patterns from design system

#### Design Notes (raw observations to address during this phase)
- **Dashboard is overwhelming** — Feels like a spreadsheet. Too many words, not enough visual hierarchy. Valuable features are buried: Google Maps location link, photo view links, and especially the publish/unpublish button are not obvious at first glance.
- **Publish/unpublish is the most important action in the app** — If contractors never find or click publish, they get zero SEO value. This button needs to be visually prominent, impossible to miss, and clearly explain what it does. Consider making it the primary CTA on each job row/card rather than a small text link in a table cell.
- **Portfolio link placement** — Currently a banner on the dashboard, but may not be the right home. Evaluate: Account tab? Dedicated section? Somewhere the contractor naturally thinks "share my work"? This is an information architecture question — where does "your public presence" live in the app's mental model?
- **Overall app organization** — The app needs a clear information architecture that separates operational tasks (check-in, view jobs) from business presence management (publish, portfolio, SEO) from admin (team, account, billing). Current nav mixes these concerns.

### Build Phase B — Embeddable Widget & Customer SEO
Goal: Push SEO value directly onto customer websites.
- [ ] **Public API endpoint** — Serve contractor's published jobs as JSON for widget consumption
- [ ] **Embeddable JS widget** — One-line script tag, injects real HTML (not iframe), photo gallery + structured data
- [ ] **Widget analytics** — Track impressions, clicks, phone calls from embedded widgets; show in dashboard
- [ ] **"Powered by" backlink** — Small branded link in widget footer drives our SEO
- [ ] **Page speed / Core Web Vitals** — Lighthouse audit, optimize images, ensure 90+ scores

### Build Phase C — GBP Automation (Growth Tier)
Goal: Automate Google Business Profile presence from job data.
- [ ] **Auto-formatted GBP posts** — AI-drafted post per job with photo, description, local keywords
- [ ] **Before/after photo tagging** — Tag photos as before/after for GBP posts and portfolio pages
- [ ] **Bulk photo management** — Select photos for GBP, auto-optimize filenames and captions
- [ ] **Set-and-forget GBP cadence** — User picks frequency (e.g., 3 posts/week), system auto-selects and publishes
- [ ] **One-tap publish to GBP** — Manual option alongside automatic

### Build Phase D — Reviews & Reputation (Growth Tier)
Goal: Automate review generation and tracking.
- [ ] **Post-job review request** — Branded SMS/email with personalized message and direct Google review link
- [ ] **Follow-up reminders** — Gentle automated sequence for non-responders
- [ ] **Review tracking** — Who left a review, rating trends, review velocity dashboard
- [ ] **Customer contact storage** — Store homeowner name/email/phone per job for review requests and CRM

### Build Phase E — Local SEO Intelligence (Premium Tier)
Goal: Give contractors visibility into their SEO performance.
- [ ] **Geo-grid rank tracking** — Heatmap showing Maps rankings across service area over time
- [ ] **NAP sync & listing health** — Store Name/Address/Phone, push to directories, consistency monitoring
- [ ] **KPI dashboard** — GBP posts this month, new reviews, jobs with photos, cities covered, visibility data

### Build Phase F — Integrations & Stickiness (Premium Tier)
Goal: Make the app indispensable by connecting to existing business tools.
- [ ] **CRM integration** — Sync customer data with popular CRMs
- [ ] **QuickBooks / finance integration** — Pull customer data, link to invoicing
- [ ] **Custom fields per org** — Let orgs rename "door type" to match their trade (roofing, HVAC, etc.)

### Build Phase G — Security & Hardening (Parallel Track)
Objective: Eliminate real abuse and trust risks. Based on actual agent audits.
- [ ] **Server-side file upload validation** — Enforce image-only MIME + max file size before Supabase write
- [ ] **Authentication hardening** — Increase password requirements + add login rate limiting + optional soft lockout
- [ ] **Role-based authorization gaps** — Enforce OWNER/ADMIN on all mutating routes (publish, edit, isPublic)
- [ ] **Error message leakage** — Generic user-facing messages + detailed server logs only
- [ ] **Verify Supabase automatic backups** — Confirm recovery posture (Owner: Keith, manual)
- [ ] **Installer-safe publishing UX** — Prevent installers from accidentally publishing bad data
- [ ] **Publish/unpublish controls** — Clear lifecycle management

### Build Phase H — Monetization
Goal: Convert validated value into repeatable revenue.
- [ ] **Stripe subscription tiers** — Free/Pro/Growth/Premium with feature gating
- [ ] **Activate Stripe Live** — Move from sandbox to production payments
- [ ] **Repeatable onboarding flow** — Reduce friction for new signups
- [ ] **Convert pilot to paid** — Use Tom as first case study
- [ ] **Determine and buy domain** — Production domain for the platform
- [ ] **Enable real email sending** — Via Resend (production-ready)

### Unscheduled Ideas
- [ ] **PWA Basics** — manifest.json + service worker for home screen install
- [ ] **Branded Watermarking** — Sharp overlay of org logo + phone on photos
- [ ] **Map View on Dashboard** — Plot all check-ins on a map using existing lat/lng data
- [ ] **CSV/PDF Export** — Export check-in data for invoicing or records
- [ ] **Client branding on public pages** — Increase perceived value

## City/ZIP Pages — Design & Strategy Notes
These pages are for platform-level SEO, NOT part of the customer-facing app experience. Key decisions captured here:

**What they are:**
- Public pages at `/locations/[city-state]` showing all published jobs in a city across ALL customers (e.g., `/locations/huntsville-al` shows jobs from every contractor in Huntsville)
- Auto-generated from job data — any city with at least one published job gets a page
- Included in sitemap.xml for Google discovery
- No login required, no nav link, not visible inside the app for customers
- Primary purpose: drive organic search traffic to the platform, position the app as a local services directory

**Who they serve:**
- **Platform owner (SaaS owner / SUPER_ADMIN):** Drives organic traffic, builds domain authority, creates a marketplace presence. City pages are the SaaS owner's growth engine.
- **Customers (business owners) — secondarily:** They get leads from people who discover their work via city pages, but customers don't interact with or manage these pages.
- **Public (homeowners searching for services):** Discovers contractors by city, sees real completed work with photos.

**SUPER_ADMIN visibility:**
- City pages will NOT be visible inside the app until a SUPER_ADMIN dashboard is built
- SUPER_ADMIN dashboard should eventually show: which city pages exist, job count per city, traffic/views per city page, coverage gaps, and tools for lead gen / business mapping
- The SUPER_ADMIN role already exists in the Prisma schema (`Role` enum) but has no dedicated UI yet

**Future strategic considerations (to revisit):**
- How to gain traction with zero customers — could city pages be seeded with local business data to provide value and attract contractors before they sign up?
- Lead gen potential — mapping local businesses by city, identifying contractors who could benefit from the platform
- Maximizing visibility for the platform while providing real value to local businesses
- Revenue model connection — how city pages tie into paid tiers (e.g., premium placement, featured contractor in a city)

**Build dependency:** Design the city page layout during Phase A2 Step 3 before implementing, so they launch looking polished. Do not build with placeholder styling.

## Environments
- **Local**: `npm run dev` on port 3000
- **Staging**: Vercel (separate Supabase instance)
- **Production**: Vercel (separate Supabase instance)
- **Rule**: NEVER push to staging or production without explicit user confirmation
