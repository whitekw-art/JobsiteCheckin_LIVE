/**
 * Where a first-run onboarding is up to, shared between the onboarding modal
 * and the coach-mark overlay. The overlay needs to write the next chapter when
 * a chapter's tour finishes, and it cannot import these from OnboardingModal
 * without a circular import (the modal already imports the overlay).
 *
 * Chapter 1 (Account Setup) is tracked by `onboardingComplete` on the
 * organization, which flips true the moment Account Setup is finished. From
 * then on the chapter key is the only record that the walkthrough (chapters
 * 2+) is still in progress, which is why the dashboard reads it to decide
 * whether to keep showing the modal.
 */
export const ONBOARDING_STEP_KEY = 'pc_onboarding_step'
export const ONBOARDING_CHAPTER_KEY = 'pc_onboarding_chapter'

/** The saved walkthrough chapter (2+), or null when no walkthrough is in progress. */
export function savedWalkthroughChapter(): number | null {
  try {
    const n = parseInt(localStorage.getItem(ONBOARDING_CHAPTER_KEY) || '', 10)
    return Number.isFinite(n) && n >= 2 ? n : null
  } catch {
    return null
  }
}
