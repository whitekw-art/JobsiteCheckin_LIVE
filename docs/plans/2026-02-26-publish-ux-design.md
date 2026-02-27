# Publish/Unpublish UX & Installer-Safe Publishing Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Make the publish action prominent and safe — a clear button, a pre-publish quality check, and a confirmation modal that guides OWNER/ADMIN toward publishing complete, well-optimized job pages.

**Architecture:** All changes are confined to `app/dashboard/page.tsx`. No API changes, no database changes, no new files. A `validateForPublish()` helper and inline `PublishModal` component are added to the existing dashboard client component.

**Tech Stack:** React (useState), Tailwind CSS, existing publish API (`/api/checkins/publish`)

---

## Decisions Made

- **Publish button style:** Prominent solid green "Publish" button; solid red "Unpublish" button when live
- **Quality check approach:** Hard block for truly broken data; soft warning modal for improvable data
- **Installer safety:** Already enforced by middleware (USER role cannot access dashboard) and API role check — no UI changes to check-in form needed
- **No URL shown in confirmation modal** — unnecessary for clean flow

---

## Publish Button

Replace the current `text-xs text-blue-600 hover:underline` publish link (desktop table) and equivalent mobile button with a proper styled button on every job row in both layouts:

- **Unpublished state:** `bg-green-600 text-white` solid button — label: `"Publish"`
- **Published state:** `bg-red-600 text-white` solid button — label: `"Unpublish"`
- **Hard blocked state:** `bg-gray-300 text-gray-500 cursor-not-allowed` disabled button — label: `"Publish"` — browser tooltip via `title` attribute: `"Add city and state before publishing"`
- All buttons: `min-h-[44px]` tap target, `px-4 py-2 rounded text-sm font-medium`
- Unpublish: single click, no confirmation, no quality check (reversible action)
- Existing "Public URL" link remains below the button when published

---

## Pre-Publish Quality Check (`validateForPublish`)

Client-side function runs when Publish is clicked. Returns `{ hardBlocked: boolean, warnings: string[] }`.

### Hard Block Conditions (button disabled, tooltip shown)
| Condition | Reason |
|-----------|--------|
| Missing `city` OR `state` | Public URL renders as `/jobs/city-state/...` literally — broken page |

### Soft Warning Conditions (shown in modal, owner can override)
| Condition | Warning Message |
|-----------|----------------|
| `photoUrls` count < 3 | "Add at least 3 photos for best results (before, during, and after)" |
| No `notes` or empty notes | "Add a job description — it helps your page rank better in Google" |
| `locationSource === 'DEVICE'` | "Verify the address — location was captured from the installer's device" |
| Missing `doorType` | "The page title will show 'Job' instead of the door type" |

---

## Publish Modal

A centered overlay modal triggered when Publish is clicked (and not hard-blocked).

### Variant A — Warnings Present
- **Title:** "Before you publish…"
- **Subtitle:** Door type + city, state (e.g., "Iron Door • Huntsville, AL")
- **Warning list:** Each warning on its own line with ⚠ amber icon
- **Recommendation text:** "We recommend resolving these issues before publishing for the best results."
- **Info note** (if org phone or website missing): gray text — "Note: your public page won't show a [phone number / business website] — add one in your business profile."
- **Buttons:**
  - `"Go Back"` — gray, secondary — recommended action (closes modal)
  - `"Publish Anyway"` — green, primary — proceeds with publish

### Variant B — No Warnings
- **Title:** "Publish this job?"
- **Body:** "This job will be publicly visible once published."
- **Info note** (if org phone or website missing): same as above
- **Buttons:**
  - `"Cancel"` — gray, secondary
  - `"Publish"` — green, primary

### Shared Modal Behavior
- Clicking outside the modal or pressing Escape closes it (no publish)
- While publish is in flight: primary button shows "Publishing…" and is disabled
- On success: modal closes, job row updates to published state
- On error: modal closes, existing `alert()` error handling fires

---

## State Changes to Dashboard

New state variables added to the existing `Dashboard` component:
- `publishModal: { checkIn: CheckIn; warnings: string[]; missingPhone: boolean; missingWebsite: boolean } | null` — `null` means modal closed

The existing `togglingId`, `publishWarnings`, and `handleTogglePublish` remain — the modal calls `handleTogglePublish` on confirm.

The existing post-publish inline warning (`publishWarnings[checkIn.id]`) is removed from the JSX — its information is now shown inside the modal before publishing instead.

---

## Out of Scope (Intentionally Deferred)

- Check-in form changes — installers don't need to know about publishing
- Dashboard table/layout redesign — that's Phase A2 Step 4
- Publish Readiness Score — future feature (noted in CLAUDE.md)
- Multi-visit job profiles — future feature (noted in CLAUDE.md)
- AI-generated job notes — future feature (noted in CLAUDE.md)
- Before/after photo tagging — future feature (Phase C)
