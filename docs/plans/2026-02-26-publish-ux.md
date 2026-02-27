# Publish UX & Installer-Safe Publishing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the buried publish text link on the dashboard with a prominent green/red button, add a `validateForPublish` quality check, and show a pre-publish confirmation modal with warnings when job data is incomplete.

**Architecture:** All changes are in `app/dashboard/page.tsx` only — no new files, no API changes, no database changes. A `validateForPublish` pure function and inline `PublishModal` component are added to the existing dashboard client component. The existing `publishWarnings` post-publish state is removed (its job moves into the pre-publish modal).

**Tech Stack:** React (useState, useEffect), Tailwind CSS, existing `/api/checkins/publish` endpoint

---

## Context

Read the design doc before starting: `docs/plans/2026-02-26-publish-ux-design.md`

The dashboard is at `app/dashboard/page.tsx`. It is a client component (`'use client'`). The relevant existing state variables and functions:
- `togglingId` — tracks which check-in is mid-publish API call
- `publishWarnings` — stores post-publish warnings about missing org phone/website **← we are removing this**
- `handleTogglePublish(checkIn)` — calls `/api/checkins/publish`, toggles `isPublic`

The dashboard renders two layouts: mobile cards (`md:hidden`) and desktop table (`hidden md:block`). Both need the publish button updated.

---

### Task 1: Add `validateForPublish`, modal state, and handlers

**File:** `app/dashboard/page.tsx`

**Step 1: Add `validateForPublish` above the `Dashboard` component**

Insert this function between the `interface CheckIn` block (ends at line 24) and the `export default function Dashboard()` line:

```typescript
function validateForPublish(checkIn: CheckIn): {
  hardBlocked: boolean
  warnings: string[]
} {
  if (!checkIn.city || !checkIn.state) {
    return { hardBlocked: true, warnings: [] }
  }
  const warnings: string[] = []
  if ((checkIn.photoUrls?.length ?? 0) < 3) {
    warnings.push('Add at least 3 photos for best results (before, during, and after)')
  }
  if (!checkIn.notes?.trim()) {
    warnings.push('Add a job description — it helps your page rank better in Google')
  }
  if (checkIn.locationSource === 'DEVICE') {
    warnings.push("Verify the address — location was captured from the installer's device")
  }
  if (!checkIn.doorType) {
    warnings.push("The page title will show 'Job' instead of the door type")
  }
  return { hardBlocked: false, warnings }
}
```

**Step 2: Add `publishModal` state inside `Dashboard` component**

After the existing `const [editAddress, setEditAddress] = useState(...)` block, add:

```typescript
const [publishModal, setPublishModal] = useState<{
  checkIn: CheckIn
  warnings: string[]
} | null>(null)
```

**Step 3: Add `handlePublishClick` and `handleConfirmPublish` inside `Dashboard`**

Add these two functions after `handleTogglePublish`:

```typescript
const handlePublishClick = (checkIn: CheckIn) => {
  const { hardBlocked, warnings } = validateForPublish(checkIn)
  if (hardBlocked) return
  setPublishModal({ checkIn, warnings })
}

const handleConfirmPublish = async () => {
  if (!publishModal) return
  await handleTogglePublish(publishModal.checkIn)
  setPublishModal(null)
}
```

**Step 4: Add ESC key handler**

Add this `useEffect` after the existing `useEffect(() => { fetchCheckIns() }, [])`:

```typescript
useEffect(() => {
  if (!publishModal) return
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setPublishModal(null)
  }
  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}, [publishModal])
```

**Step 5: Verify the file builds**

Run: `npm run build`
Expected: no TypeScript errors. If errors, fix before proceeding.

**Step 6: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add validateForPublish helper and publish modal state"
```

---

### Task 2: Add `PublishModal` component and render it

**File:** `app/dashboard/page.tsx`

**Step 1: Add `PublishModal` component above `Dashboard`**

Insert this function immediately before `export default function Dashboard()`:

```typescript
function PublishModal({
  checkIn,
  warnings,
  onConfirm,
  onClose,
  isPublishing,
}: {
  checkIn: CheckIn
  warnings: string[]
  onConfirm: () => void
  onClose: () => void
  isPublishing: boolean
}) {
  const jobLabel = [
    checkIn.doorType,
    [checkIn.city, checkIn.state].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' • ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {warnings.length > 0 ? 'Before you publish\u2026' : 'Publish this job?'}
        </h2>
        {jobLabel && (
          <p className="text-sm text-gray-500 mt-1">{jobLabel}</p>
        )}

        {warnings.length > 0 ? (
          <>
            <ul className="mt-4 space-y-2">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="mt-0.5 shrink-0">\u26a0</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              We recommend resolving these issues before publishing for the best results.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            This job will be publicly visible once published.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 min-h-[44px]"
          >
            {warnings.length > 0 ? 'Go Back' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing}
            className="px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
          >
            {isPublishing
              ? 'Publishing\u2026'
              : warnings.length > 0
              ? 'Publish Anyway'
              : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Render `PublishModal` in the Dashboard return**

Inside the Dashboard `return (...)`, find the outermost closing `</div>` (the one that closes `<div className="min-h-screen bg-gray-50 p-4">`). Insert the modal just before it:

```tsx
{publishModal && (
  <PublishModal
    checkIn={publishModal.checkIn}
    warnings={publishModal.warnings}
    onConfirm={handleConfirmPublish}
    onClose={() => setPublishModal(null)}
    isPublishing={togglingId === publishModal.checkIn.id}
  />
)}
```

**Step 3: Verify the file builds**

Run: `npm run build`
Expected: no errors.

**Step 4: Manual smoke test**

Run `npm run dev`, open the dashboard. The page should render normally — no visual changes yet to the publish button. Verify no console errors.

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add PublishModal component"
```

---

### Task 3: Update desktop table publish column

**File:** `app/dashboard/page.tsx` — desktop table section (`hidden md:block`)

**Step 1: Find the publish column `<td>` in the desktop table**

Locate this block (currently around line 659):

```tsx
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  <button
    type="button"
    onClick={() => handleTogglePublish(checkIn)}
    disabled={togglingId === checkIn.id}
    className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
  >
    {togglingId === checkIn.id
      ? 'Saving...'
      : checkIn.isPublic
      ? 'Unpublish'
      : 'Publish'}
  </button>
  {checkIn.isPublic && (
    <div className="mt-1 text-xs">
      {(() => {
        const citySlug = slugify(checkIn.city || '')
        const stateSlug = slugify(checkIn.state || '')
        const doorTypeSlug = slugify(checkIn.doorType || 'job')
        const base =
          (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || ''
        const path = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${checkIn.id}`
        const href = base ? `${base}${path}` : path
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Public URL
          </a>
        )
      })()}
    </div>
  )}
  {publishWarnings[checkIn.id] && (
    <div className="mt-1 text-xs text-amber-600">
      {publishWarnings[checkIn.id]}
    </div>
  )}
</td>
```

**Step 2: Replace the entire `<td>` block with the new version**

```tsx
<td className="px-6 py-4 whitespace-nowrap text-sm">
  {checkIn.isPublic ? (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleTogglePublish(checkIn)}
        disabled={togglingId === checkIn.id}
        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
      >
        {togglingId === checkIn.id ? 'Saving\u2026' : 'Unpublish'}
      </button>
      {(() => {
        const citySlug = slugify(checkIn.city || '')
        const stateSlug = slugify(checkIn.state || '')
        const doorTypeSlug = slugify(checkIn.doorType || 'job')
        const base =
          (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || ''
        const path = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${checkIn.id}`
        const href = base ? `${base}${path}` : path
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Public URL
          </a>
        )
      })()}
    </div>
  ) : (
    (() => {
      const { hardBlocked } = validateForPublish(checkIn)
      return (
        <button
          type="button"
          onClick={() => handlePublishClick(checkIn)}
          disabled={hardBlocked || togglingId === checkIn.id}
          title={hardBlocked ? 'Add city and state before publishing' : undefined}
          className={`px-4 py-2 rounded text-sm font-medium min-h-[44px] ${
            hardBlocked
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-75`}
        >
          Publish
        </button>
      )
    })()
  )}
</td>
```

**Step 3: Verify the file builds**

Run: `npm run build`
Expected: no errors. If TypeScript complains about `publishWarnings` being unused, that's fine — it gets cleaned up in Task 4.

**Step 4: Manual test — desktop layout**

Run `npm run dev`. On a desktop browser (viewport wider than 768px), open the dashboard.
- A draft job with missing city/state → gray disabled "Publish" button with tooltip on hover
- A draft job with city/state present → green "Publish" button
- Clicking green "Publish" → modal opens
- A published job → red "Unpublish" button + "Public URL" link below it

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: update desktop table publish button with modal flow"
```

---

### Task 4: Update mobile card publish button and remove `publishWarnings`

**File:** `app/dashboard/page.tsx` — mobile cards section (`md:hidden`)

**Step 1: Find the publish button in the mobile card actions row**

Locate this block (currently around line 396):

```tsx
<button
  type="button"
  onClick={() => handleTogglePublish(checkIn)}
  disabled={togglingId === checkIn.id}
  className="text-sm text-blue-600 hover:underline py-2 min-h-[44px] disabled:text-gray-400"
>
  {togglingId === checkIn.id ? 'Saving...' : checkIn.isPublic ? 'Unpublish' : 'Publish'}
</button>
```

**Step 2: Replace the mobile publish button**

```tsx
{checkIn.isPublic ? (
  <button
    type="button"
    onClick={() => handleTogglePublish(checkIn)}
    disabled={togglingId === checkIn.id}
    className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
  >
    {togglingId === checkIn.id ? 'Saving\u2026' : 'Unpublish'}
  </button>
) : (
  (() => {
    const { hardBlocked } = validateForPublish(checkIn)
    return (
      <button
        type="button"
        onClick={() => handlePublishClick(checkIn)}
        disabled={hardBlocked || togglingId === checkIn.id}
        title={hardBlocked ? 'Add city and state before publishing' : undefined}
        className={`px-4 py-2 rounded text-sm font-medium min-h-[44px] ${
          hardBlocked
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        } disabled:opacity-75`}
      >
        Publish
      </button>
    )
  })()
)}
```

**Step 3: Remove `publishWarnings` display from mobile card**

Find and delete this block from the mobile card (around line 429):

```tsx
{publishWarnings[checkIn.id] && (
  <p className="text-xs text-amber-600">{publishWarnings[checkIn.id]}</p>
)}
```

**Step 4: Remove `publishWarnings` state and its usages**

Find and delete the state declaration:
```typescript
const [publishWarnings, setPublishWarnings] = useState<Record<string, string>>({})
```

Find and delete all `setPublishWarnings(...)` calls inside `handleTogglePublish` (there are two — the one that sets a warning message and the one that clears it).

**Step 5: Verify the file builds with no TypeScript errors**

Run: `npm run build`
Expected: clean build, no unused variable warnings.

**Step 6: Full manual test**

Run `npm run dev` and test on both mobile (< 768px) and desktop:

| Scenario | Expected |
|----------|----------|
| Draft job, missing city/state | Gray disabled "Publish" button, tooltip on hover |
| Draft job, has city/state, no photos, no notes | Green "Publish" → modal with 2+ warnings → "Go Back" / "Publish Anyway" |
| Draft job, fully complete | Green "Publish" → simple confirm modal → "Cancel" / "Publish" |
| Clicking "Publish Anyway" or "Publish" | Job publishes, modal closes, button becomes red "Unpublish" |
| Published job | Red "Unpublish" + "Public URL" link |
| Clicking "Unpublish" | Job unpublishes immediately, no modal |
| Pressing ESC while modal open | Modal closes, no publish |
| Clicking modal overlay | Modal closes, no publish |

**Step 7: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: update mobile publish button and remove post-publish inline warnings"
```
