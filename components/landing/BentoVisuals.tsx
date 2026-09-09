/**
 * The pictures that sit inside the landing page's feature tiles.
 *
 * These are COPIES of the markup currently inline in components/LandingPage.tsx,
 * deliberately duplicated rather than extracted, so the live landing page is not
 * touched while Storyblok editing is being evaluated. If the CMS route is
 * adopted, LandingPage.tsx should be switched to import from here and the
 * duplication removed in the same change.
 *
 * TEST ONLY — rendered by /landing-preview.
 */

export function PortfolioVisual() {
  return (
    <div className="bc-browser">
      <div className="bcb-chrome">
        <div className="bcb-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="bcb-bar">projectcheckin.com/portfolio/YOUR-COMPANY-HERE</div>
      </div>
      <div className="bcb-viewport">
        <iframe
          src="https://jobsite-checkin-staging.vercel.app/portfolio/wave-advisory-3e10"
          className="bcb-frame"
          scrolling="no"
          frameBorder="0"
          title="Portfolio page preview"
        />
      </div>
    </div>
  )
}

export function GbpVisual() {
  return (
    <div className="gbp-preview">
      <div className="gbp-source">
        <div className="gbp-g"></div>
        <span className="gbp-name">Your Business on Google</span>
      </div>
      <div className="gbp-text">
        &ldquo;Completed a custom door installation in Brentwood today. New craftsman-style entry
        with updated hardware. Before and after photos below...&rdquo;
      </div>
      <button className="gbp-copy-btn" type="button">
        Copy Post Text
      </button>
    </div>
  )
}

export function ReviewVisual() {
  return (
    <>
      <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <div className="rev-preview">
        <div className="rev-msg">
          &ldquo;Sarah &mdash; we really appreciated your business. Hope you love the new door. If
          you have a minute, a Google review helps us more than you know: [review link]&rdquo;
        </div>
      </div>
    </>
  )
}

export function BentoVisual({ kind }: { kind?: string }) {
  if (kind === 'portfolio') return <PortfolioVisual />
  if (kind === 'gbp') return <GbpVisual />
  if (kind === 'review') return <ReviewVisual />
  return null
}
