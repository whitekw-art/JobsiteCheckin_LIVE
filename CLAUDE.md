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
  jobs/[location]/[slug]/           # Public SEO job pages (server: page.tsx, client: JobDetailClient.tsx)
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
  JobPhoneLink.tsx / JobWebsiteLink.tsx / JobPhotoLink.tsx  # Click-tracked links (support optional className prop for themed pages)
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
docs/
  field-service-app-ux-research.md  # Phase A2 competitor/design research
  mockups/                          # HTML mockups for design review (v2-v5)
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
Local SEO automation platform for field service businesses. Every job completed through the app automatically generates SEO value in TWO places: the contractor's own website (via embeddable widget) AND our platform (via public job pages). The app does NOT require blogging or manual content — job data IS the content.

### Value Hierarchy (locked in)
1. **Customer value FIRST** — Job pages and portfolio pages exist to drive traffic, leads, and sales TO the contractor (Tom). If Tom can't see measurable ROI, he cancels. Everything public-facing is a customer value delivery vehicle.
2. **Platform growth SECOND** — City/location pages aggregate all contractors and drive organic traffic to our domain. These help acquire new contractor customers. Contractors don't interact with these pages.
3. **Embeddable widget = premium play** — Pushes SEO value directly onto the contractor's own website. Upgrade from "we host your portfolio" to "we make YOUR website rank better."

### The "No Brainer" Sale
The app must PROVE and QUANTIFY the value it delivers to each customer. The reporting tab should show simple, clear metrics that even non-tech contractors understand:
- Page views on their published jobs
- Phone calls generated (tapped "Get a Free Estimate")
- Website visits driven to their site
- Top-performing job page
- Monthly trend (are things growing?)

**Keep it simple.** The audience is older, blue-collar, non-tech. No jargon, no vanity metrics, no confusing charts. Think: "Tom, you got 23 calls this month from your published jobs." That's the sale.

### Attribution & Tracking Requirements
Every CTA on public pages (portfolio, job pages, widget) must be instrumented:
- Phone taps → tracked as lead events (already: `phone_click`)
- Website clicks → tracked as referrals (already: `website_click`)
- "Get a Free Estimate" taps → tracked as hot lead events (needed)
- Page views → tracked per org, per job, per time period (partially done: `page_view`)
- Referral source → where the visitor came from: Google, Facebook, direct link (needed: UTM/referrer tracking)

### External Tools
- **Google Search Console** — Already configured for the app domain. Can show impressions, clicks, and keyword rankings for published pages. Future: API integration to pull data into reporting tab.

### Page Purpose Map
| Page Type | Primary Purpose | Audience |
|-----------|----------------|----------|
| Job pages (`/jobs/...`) | Drive leads for contractor | Homeowners searching for services |
| Portfolio page (`/portfolio/...`) | Proof-of-work landing page for contractor | Referred homeowners evaluating contractor |
| City pages (`/locations/...`) | Drive platform SEO, acquire new contractors | Homeowners + contractors searching by city |
| Embeddable widget (Phase B) | Push SEO value onto contractor's own site | Contractor's website visitors |

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
- [x] **Job Detail Page Redesign** — Premium dark+gold aesthetic matching portfolio v10. Photo gallery with lightbox, thumbnail strip, sticky contact card, related projects section, CTA band, tracked CTAs. Server/client split pattern (page.tsx + JobDetailClient.tsx). (DEPLOYED)

## Feature Roadmap

### Build Phase A — SEO Foundation
Goal: Complete the SEO infrastructure on our domain so pages get indexed and rank.
- [x] **Sitemap.xml** — Auto-list all published job URLs; include only public jobs; serve at /sitemap.xml (DEPLOYED)
- [x] **Clean URL audit** — URL pattern `/jobs/{city}-{state}/{doorType}-{uuid}` verified as SEO-optimal and privacy-safe (DONE)
- [x] **Mobile responsive fixes** — Hamburger nav, card layout on dashboard, tap target fixes, form labels, responsive padding, viewport zoom (DEPLOYED)
- [x] **Public Company Portfolio Page** — `/portfolio/[org-slug]` listing all published jobs for a contractor (DEPLOYED — redesigned with design system in Phase A2)
- [ ] **City/ZIP landing pages** — `/locations/[city-state]` auto-enriched when jobs are completed there (see City Pages Notes below) — UNBLOCKED: all SEO audit fixes complete, existing pages now properly crawlable. **POSTPONED** — deferred to after launch. Low urgency: new domain needs authority first, pages need job volume to be useful, and they're platform growth (not customer value). Revisit after real customers are onboarded.

### SEO Audit Fixes (CURRENT PRIORITY — Do Before City Pages)
Full audit report: `.claude/skills/seo-audit/FULL-AUDIT-REPORT.md`
Action plan: `.claude/skills/seo-audit/ACTION-PLAN.md`
**Audit date:** 2026-02-23 | **Score:** 52/100 | **Production URL:** https://jobsite-checkin-live-du7t.vercel.app

**Why this comes first:** The audit found that Google may not be able to properly crawl or index the pages we've already built and deployed. Fixing these issues before building city pages ensures all existing AND future pages benefit.

#### Critical (Blocking Google — Fix Immediately)
- [x] **Fix robots.txt middleware block** — Added `pathname !== '/robots.txt'` to middleware allowlist. (File: `middleware.ts`) (DONE)
- [x] **Create robots.txt** — Created `public/robots.txt`. Allows `/jobs/`, `/portfolio/`, `/sitemap.xml`. Disallows all private routes (`/auth/`, `/dashboard/`, `/api/`, etc.). References sitemap. (DONE)
- [x] **Fix JSON-LD image URLs (relative → absolute)** — Image URLs in JSON-LD now prepend `baseUrl` when not already absolute. (File: `app/jobs/[location]/[slug]/page.tsx`) (DONE)
- [x] **Fix homepage in sitemap** — Removed homepage entry from sitemap since it redirects to login. Sitemap now only contains job pages and portfolio pages that return 200. (File: `app/sitemap.ts`) (DONE)

#### High (Significantly Impacts Rankings — Fix Within 1 Week)
- [x] **Add canonical tags** — Added `alternates.canonical` to `generateMetadata()` on both job and portfolio pages. (Files: `app/jobs/.../page.tsx`, `app/portfolio/.../page.tsx`) (DONE)
- [x] **Optimize image file sizes** — Replaced `<img>` with Next.js `<Image>` on all public-facing pages (job detail + portfolio). Automatic WebP/AVIF conversion, responsive `sizes`, `priority` on above-fold images. Configured `next.config.js` with Supabase `remotePatterns`. Works with any custom domain on Vercel. (Files: `JobDetailClient.tsx`, `PortfolioClient.tsx`, `next.config.js`) (DONE)
- [x] **Expand meta descriptions** — Expanded from ~60 chars to 150+ chars. Now includes business name, service type, location, and CTA ("get a free estimate"). (Files: `generateMetadata()` in both page.tsx files) (DONE)
- [x] **Add datePublished to structured data** — Added `datePublished` and `dateModified` to JSON-LD using check-in timestamp. (File: `app/jobs/.../page.tsx`) (DONE)
- [x] **Fix grammar in auto-generated text** — Vowel article: "a Iron Door" → "an Iron Door" via `/^[aeiou]/i` check. Pluralization: "1 jobs" → "1 job" in both meta descriptions and PortfolioClient UI. (Files: job + portfolio page.tsx, PortfolioClient.tsx) (DONE)

### Build Phase A2 — Design & UX Overhaul
Goal: Establish a cohesive visual identity and professional look across all pages — especially public-facing surfaces — before building the embeddable widget that will live on customer websites.

**Why here:** The embeddable widget (Phase B) will be embedded on contractor websites and seen by their customers. It must look professional. Every public-facing feature built without a design foundation (portfolio page, job pages, city pages) will need rework later. Doing design now prevents compounding design debt.

#### Step 1: Research & Inspiration (DONE)
- [x] **Competitor audit** — Analyzed 8 apps: Jobber, Housecall Pro, CompanyCam, ServiceTitan, GorillaDesk, BuildBook, Thumbtack, Houzz. Full write-up in `docs/field-service-app-ux-research.md`
- [x] **Best practices research** — Covered via competitor deep-dives; patterns documented in synthesis tables below
- [x] **Identify design principles** — 5 guiding principles established (see below)

#### Research Findings — Design Principles for Non-Tech Blue-Collar Users
1. **"Zero Training" (BuildBook):** If a feature needs explanation, redesign it. Every screen has one obvious primary action.
2. **Camera-First (CompanyCam):** The most common action (photo at jobsite) is 1 tap from any screen. Auto-tag with GPS/time.
3. **Card-Based, Action-Oriented Dashboard (Jobber):** Show what needs attention NOW — actionable items, not raw data.
4. **Large Tap Targets + Offline Resilience (Housecall Pro):** Assume work gloves, sunlight, spotty cell service.
5. **Less Is More (GorillaDesk):** A limited, well-executed feature set beats comprehensive-but-overwhelming every time.

#### Research Findings — Navigation
- **Desktop:** Left sidebar navigation (Jobber, ServiceTitan pattern)
- **Mobile:** Bottom tab bar (Jobber, HCP, CompanyCam pattern)
- **Hierarchy:** 2 levels max — critical for our users (GorillaDesk, BuildBook)

#### Research Findings — Visual Style Direction (DECIDED)
- **Primary color:** Forest green (`primary-*`) — trust, growth, trades (Jobber/CompanyCam/GorillaDesk pattern)
- **Backgrounds:** White/light gray, never dark for primary UI
- **Typography:** Large sans-serif (16px+ body), high contrast
- **Buttons:** Large, full-width on mobile, high-contrast color
- **Cards:** Rounded corners, subtle shadows, clear boundaries
- **Density:** LOW — favor whitespace over data density (BuildBook, GorillaDesk)
- **Photos:** Large thumbnails, grid layout, tap to expand

#### Research Findings — Portfolio Page Patterns (HIGH priority)
- Project-as-collection, not loose photos (Houzz, CompanyCam)
- Filterable photo grid / masonry gallery (CompanyCam, Houzz)
- Interactive map showing completed job locations (CompanyCam)
- Trust badges + "Jobs completed" counter (Thumbtack)
- Before/after photo templates, auto-branded (CompanyCam)
- Cover photo / hero image at top (Houzz)

#### Research Findings — Dashboard Patterns (HIGH priority)
- Card-based dashboard with clear action items (Jobber, HCP)
- "Recommended next actions" surfaced on dashboard (Jobber)
- Color-coded job/status system (all competitors)
- Pre-built templates, not blank canvas (ServiceTitan)

#### Step 2: Design System Foundation (DONE)
- [x] **Color palette** — Primary: muted sage-forest green (`primary-*`), Accent: warm gold (`accent-*`), Neutrals: warm gray (`surface-*`). Softened v5 palette approved — desaturated ~30% from initial vivid greens. Defined in `tailwind.config.ts`.
- [x] **Typography** — Display: Bricolage Grotesque (headings, stats), Body: DM Sans (everything else). Google Fonts loaded in `globals.css`. 16px+ base for readability.
- [x] **Spacing & layout rules** — `rounded-card` (12px), `shadow-card` / `shadow-card-hover` / `shadow-elevated` box shadows. Warm neutral backgrounds (`surface-50`).
- [ ] **Component inventory** — Catalog existing UI patterns and define canonical styles (pending — will emerge as pages are redesigned)

#### Step 3: Public Pages Redesign
- [x] **Portfolio page** — v5 mockup approved (`docs/mockups/portfolio-v5.html`). Split hero (text left, photo mosaic right), simplified trust signals (jobs completed + account age), region-based location, sticky filter tabs by service type, photo-forward job cards with hover effects, ghost-style website button, bottom CTA, powered-by footer. Implemented in `app/portfolio/[orgSlug]/page.tsx`.
- [x] **Job detail page** — Redesigned with premium dark+gold v10 aesthetic. Server/client split (`page.tsx` + `JobDetailClient.tsx`). Features: dark header with business name + CTA, featured photo + thumbnail strip, CSS-only lightbox with keyboard nav, two-column details (job info left, glassmorphism contact card right), "About This Project" notes section with gold border, related projects grid (4 cards from same org), dark CTA band with noise texture, portfolio-matching footer. All photos use `<img>` with descriptive alt text for Google Images SEO. All CTAs tracked via existing event system. (DONE)
- [ ] **Navigation overhaul** — Evaluate current horizontal nav vs. sidebar, mobile hamburger behavior, information architecture for different user roles
- [ ] **City/ZIP landing pages** — Design these before building them (Phase A remaining item) so they launch looking polished

#### Step 4: Internal Pages Refresh
- [ ] **Dashboard** — Apply design system: cleaner stats cards, better table design, improved publish/edit UX, column filtering (by installer, city, door type, date range, publish status) so OWNER/ADMIN can slice data without needing a separate "My Jobs" view
- [ ] **Check-in form** — Apply consistent form styling
- [ ] **My Jobs gallery** — Apply card and grid patterns from design system

#### Design Notes (raw observations to address during this phase)
- **Dashboard is overwhelming** — Feels like a spreadsheet. Too many words, not enough visual hierarchy. Valuable features are buried: Google Maps location link, photo view links, and especially the publish/unpublish button are not obvious at first glance.
- **Publish/unpublish is the most important action in the app** — If contractors never find or click publish, they get zero SEO value. This button needs to be visually prominent, impossible to miss, and clearly explain what it does. Consider making it the primary CTA on each job row/card rather than a small text link in a table cell.
- **Portfolio link placement** — Currently a plain hyperlink on the dashboard — needs to be a prominent button or clean visual element, not just a text link. Also evaluate placement: Account tab? Dedicated section? Somewhere the contractor naturally thinks "share my work"? This is an information architecture question — where does "your public presence" live in the app's mental model?
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

**IN PROGRESS** — Branch: `feature/2026-02-23-security-hardening` | Plan: `docs/plans/2026-02-23-security-hardening.md`

**Upstash note:** Staging and production currently share the same Upstash Redis database (same env vars in both). Before scaling beyond pilot, create a separate free Upstash database for staging and update its env vars independently.

**`/api/download-photos` note:** This route has no auth check but reads from local filesystem (`public/temp-photos/`). It is non-functional on Vercel (serverless has no persistent FS), so it is low production risk. Fix when this route is refactored to serve Supabase-hosted photos.

#### Task progress (9 tasks total):
- [x] **Task 1** — Extract authOptions to `lib/auth-config.ts`; fix `as any` casts in JWT callback; add `companyName` to JWT + Session interfaces in `types/next-auth.d.ts` (commits: `6059d6d`, `6471675`)
- [x] **Task 2** — Fix `getServerSession()` calls to pass `authOptions` in `lib/auth.ts` and `lib/auth-helpers.ts` (commit: `283f59d`)
- [x] **Task 3** — Add auth guard + magic-byte MIME validation + 10MB size cap to `/api/upload-photo` (commit: `d1a9e73`)
- [x] **Task 4** — Add auth + OWNER/ADMIN role + org scoping to `/api/checkins/publish` (commit: `4395f90`)
- [x] **Task 5** — Add OWNER/ADMIN role check to `/api/checkins/address` (commit: `15cc687`)
- [x] **Task 6** — Add `eventType` whitelist to `/api/checkins/events`; normalize event type casing to lowercase in all sender components; update reporting queries to accept both uppercase and lowercase for backward compatibility (commits: `a6eed91`, `ae99f61`, `be7de30`)
- [x] **Task 7** — Fix raw `error.message` leakage in ~5 catch blocks (commit: `dd8898e`)
- [x] **Task 8** — Update password minimum to 8 chars (both registration paths) (commit: `9b08b39`)
- [x] **Task 9** — Add Upstash Redis rate limiting to login (5 attempts / 15 min per email) — `lib/rate-limit.ts` created, integrated into `lib/auth-config.ts` authorize function with fail-open error handling (commit: `7a944ff`)

#### Original Phase G items (mapped to tasks above):
- [ ] **Server-side file upload validation** — Task 3
- [ ] **Authentication hardening** — Tasks 8 + 9
- [ ] **Role-based authorization gaps** — Tasks 4 + 5
- [ ] **Error message leakage** — Task 7
- [ ] **Verify Supabase automatic backups** — Confirm recovery posture (Owner: Keith, manual) — not yet started
- [ ] **Installer-safe publishing UX** — Prevent installers from accidentally publishing bad data — not yet started
- [ ] **Publish/unpublish controls** — Clear lifecycle management — not yet started

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
- [ ] **Multi-visit job profiles** — A persistent "Job" entity that stays open across multiple installer visits. Installer visits on day 1 to capture before photos + initial info; returns when job is complete to add after photos and final notes. Job remains in Draft until marked complete by OWNER/ADMIN, then published. Requires: new Job model with status (In Progress/Complete), ability for installers to search/find and update an existing open job, photo management per-visit, before/after photo distinction. This is a meaningful data model change — deserves a full brainstorming session before implementation.
- [ ] **Publish Readiness Score** — Per-job quality indicator on the dashboard showing how well-optimized a job is for SEO and publishing. Simple colored indicator (green/yellow/red) based on: photo count (3+ = good), notes present, verified address, door type filled in, etc. Each level shows specific recommendations to improve. Must remain simple and non-intrusive — one small indicator per job row, expandable on click. Do NOT add complexity to the main publish flow.
- [ ] **AI-generated job notes** — Auto-populate job description/notes from structured data (door type, location, photos). Reduces burden on installers who don't write descriptions. Candidate for Growth tier. Consider as part of multi-visit job profiles feature.

## SEO Feature Inventory & Value Proposition

This section maps every SEO-driving element in the app — what's built, what's planned, and what's not yet explored. It also serves as a value proposition reference for marketing materials and customer conversations.

### BUILT — Currently Driving SEO

| Feature | Benefits Who? | Impact | Status |
|---------|--------------|--------|--------|
| **Job pages** (`/jobs/[city-state]/[slug]`) — unique URL per published job | Customer + Platform | HIGH | DEPLOYED |
| **JSON-LD structured data** (Service + LocalBusiness + ImageObject) on job pages | Customer + Platform | HIGH | DEPLOYED |
| **Open Graph + Twitter cards** on job pages | Customer + Platform | MEDIUM | DEPLOYED |
| **SEO title/description meta tags** — auto-generated from job data | Customer + Platform | HIGH | DEPLOYED |
| **Descriptive image alt text** (`{doorType} in {city}, {state}`) | Customer + Platform | MEDIUM | DEPLOYED |
| **`<img>` tags** (not CSS backgrounds) for Google Images indexing | Customer + Platform | HIGH | DEPLOYED |
| **Portfolio pages** (`/portfolio/[orgSlug]`) with JSON-LD (LocalBusiness + OfferCatalog) | Customer (primarily) | HIGH | DEPLOYED |
| **Sitemap.xml** — auto-lists all published job URLs | Platform + Customer | HIGH | DEPLOYED |
| **Photo-forward design** — large images near relevant text content | Both (Google Images) | MEDIUM | DEPLOYED |
| **Mobile-responsive pages** — Google's mobile-first indexing | Both | HIGH | DEPLOYED |
| **Internal linking** — related projects on job pages, "View Full Portfolio" links | Platform + Customer | MEDIUM | DEPLOYED |
| **Page view / phone / website click tracking** — proves ROI to customer | Customer (indirectly) | LOW (SEO) | DEPLOYED |

### PLANNED — Not Yet Built

| Feature | Benefits Who? | Impact | Phase |
|---------|--------------|--------|-------|
| **City/ZIP landing pages** (`/locations/[city-state]`) | Platform (primarily) | HIGH | A (next) |
| **Embeddable widget** on customer websites | Customer (primarily) | VERY HIGH | B |
| **"Powered by" backlinks** from embedded widgets | Platform | HIGH | B |
| **GBP (Google Business Profile) auto-posts** | Customer | HIGH | C |
| **Before/after photo tagging** | Customer | MEDIUM | C |
| **Review generation** (post-job review requests) | Customer | VERY HIGH | D |
| **Geo-grid rank tracking** (local ranking visibility) | Customer | LOW (SEO) / HIGH (value) | E |
| **NAP consistency** (Name/Address/Phone sync) | Customer | MEDIUM | E |

### NOT YET EXPLORED — Opportunities to Investigate

| Opportunity | Benefits Who? | Impact | Effort | Notes |
|-------------|--------------|--------|--------|-------|
| **Keyword strategy / targeting** | Both | VERY HIGH | Low | Zero intentional keyword targeting currently. Need a keyword map: job pages → `{doorType} installation {city} {state}`, city pages → `door installer {city}`, portfolio pages → `{businessName} reviews/portfolio`. |
| **App/brand name & domain** | Platform | HIGH | Low | "Jobsite Check-In" — is this the final name? Domain choice matters enormously. `.com` preferred. Needs a dedicated naming session before buying production domain. |
| **Domain authority building** | Platform | VERY HIGH | Ongoing | New domain = low trust. Strategies: backlinks from contractor websites (widget does this), business directory submissions, trade publication mentions. Widget (Phase B) is the biggest DA play. |
| **Google Search Console optimization** | Both | HIGH | Low | GSC is connected but data isn't being used yet. Should check: which queries trigger impressions, indexed pages, crawl errors, mobile usability issues. Free intelligence. |
| **Image SEO beyond alt text** | Both | MEDIUM | Low | Image filenames (currently UUIDs from Supabase), dedicated image sitemap, image compression/WebP format, image dimensions in markup. Google Images is a major traffic source for visual trades. |
| **URL / canonical strategy** | Both | MEDIUM | Low | Check for duplicate content issues, staging `noindex`, canonical tags, overlapping content between portfolio and job pages. **PROMOTED: canonical tags now in SEO Audit Fixes (High).** |
| **Page speed / Core Web Vitals** | Both | HIGH | Medium | Google ranking signal. Photos from Supabase Storage may not be optimized. Next.js `<Image>` component for automatic WebP/AVIF. LCP is likely the featured photo on job pages. **PROMOTED: image optimization now in SEO Audit Fixes (High).** |
| **Local SEO signals** | Customer | VERY HIGH | Medium | Beyond structured data: consistent NAP, Google Maps embeds on job/city pages, geo-tagged photos (EXIF data already captured), location-specific content. Lat/lng exists — could embed maps. |
| **Content freshness signals** | Both | MEDIUM | Low | Add `datePublished` / `dateModified` to structured data. Every new published job is a freshness signal, but only if Google knows the date. **PROMOTED: datePublished now in SEO Audit Fixes (High).** |
| **Robots.txt audit** | Platform | MEDIUM | Low | Check for accidentally blocked pages. Consider allowing AI crawlers (GPTBot, ClaudeBot) for AI search result citations. **PROMOTED: robots.txt now in SEO Audit Fixes (Critical).** |
| **Service area pages** (broader than city) | Platform | MEDIUM | Medium | Regional pages like "Door Installation in North Alabama" or "Door Installers near Madison County" targeting broader geographic queries. |
| **FAQ schema** on job/portfolio pages | Both | MEDIUM | Low | FAQ structured data answering common questions: "How much does a {doorType} cost?", "How long does installation take?" — can win Featured Snippets. |
| **Social proof / review schema** | Customer | HIGH | Medium | When Phase D adds reviews, `AggregateRating` schema on portfolio pages enables star ratings in Google search results. Major CTR boost. |
| **Blog / content hub** (platform SEO) | Platform | HIGH | High | Programmatic content targeting informational queries: "How to choose a garage door", etc. Conflicts with "no blogging" principle, but AI-generated content from job data could work. |

### SEO Attribution Summary — Who Benefits From What

| SEO Channel | Customer's SEO | Platform's SEO |
|-------------|---------------|----------------|
| Job pages | Direct — ranks for their service + city | Direct — content on your domain |
| Portfolio pages | Direct — ranks for their business name | Indirect — content on your domain |
| City pages | Indirect — their jobs appear | Direct — ranks for city queries |
| Embeddable widget | Direct — adds content + schema to their site | Direct — backlink from their site |
| GBP posts | Direct — their Google profile | None |
| Reviews | Direct — their reputation | Indirect — UGC on your domain |
| Domain/brand | None | Direct — platform brand awareness |

### Customer Value Proposition (for marketing)
When selling to contractors, the app delivers SEO value they can't easily get on their own:
- **Every job automatically becomes a search-engine-optimized web page** — no blogging, no content creation
- **Professional portfolio page** — shareable link that ranks for their business name
- **Google Images visibility** — properly tagged photos rank in image search for local service queries
- **Structured data** — tells Google exactly what service was performed and where, improving search result appearance
- **Measurable ROI** — track page views, phone calls, and website visits generated from published jobs
- **Future: widget pushes SEO onto their own website** — the contractor's site gets richer content and schema markup automatically

---

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
