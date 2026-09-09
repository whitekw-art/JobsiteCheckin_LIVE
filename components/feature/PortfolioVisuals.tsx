/**
 * The two custom mockups used on the Portfolio feature page — a browser-frame
 * grid preview (hero) and a phone-frame preview (dark showcase section).
 * COPIES of markup currently inline in components/Portfolio.tsx, deliberately
 * duplicated so the live feature page stays untouched — see the note in
 * components/landing/BentoVisuals.tsx for why. Fixed sample data, same as
 * the live page's own hardcoded example. TEST ONLY.
 */

const phoneIcon = (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
)

const shareIcon = (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
  </svg>
)

export function PortfolioBrowserMockupVisual() {
  return (
    <div className="browser-frame">
      <div className="browser-chrome">
        <div className="browser-dots">
          <div className="browser-dot red" />
          <div className="browser-dot amber" />
          <div className="browser-dot green" />
        </div>
        <div className="browser-url">projectcheckin.com/portfolio/carters-iron-doors</div>
      </div>
      <div>
        <div className="pc-head">
          <div className="pc-biz">
            <div className="pc-avatar">CI</div>
            <div>
              <div className="pc-biz-name">Carter&apos;s Iron Doors</div>
              <div className="pc-biz-sub">Nashville, TN &middot; Est. 2018</div>
            </div>
          </div>
          <div className="pc-call-btn">{phoneIcon} Call Now</div>
        </div>
        <div className="pc-filters">
          <span className="pc-chip active">All Work</span>
          <span className="pc-chip passive">Iron Door</span>
          <span className="pc-chip passive">Wood Door</span>
          <span className="pc-chip passive">Garage</span>
        </div>
        <div className="pc-grid">
          <div className="pc-item">
            <div className="pc-thumb t1">
              <span className="pc-thumb-label">Iron Door</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Iron Door</div>
              <div className="pc-meta-loc">Nashville, TN</div>
            </div>
          </div>
          <div className="pc-item">
            <div className="pc-thumb t2">
              <span className="pc-thumb-label">Wood Door</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Wood Door</div>
              <div className="pc-meta-loc">Franklin, TN</div>
            </div>
          </div>
          <div className="pc-item">
            <div className="pc-thumb t3 pc-thumb-new">
              <span className="pc-thumb-label">Garage Door</span>
              <span className="pc-new-badge">New</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Garage Door</div>
              <div className="pc-meta-loc">Brentwood, TN</div>
            </div>
          </div>
          <div className="pc-item">
            <div className="pc-thumb t4">
              <span className="pc-thumb-label">Iron Door</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Iron Door</div>
              <div className="pc-meta-loc">Murfreesboro, TN</div>
            </div>
          </div>
          <div className="pc-item">
            <div className="pc-thumb t5">
              <span className="pc-thumb-label">Wood Door</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Wood Door</div>
              <div className="pc-meta-loc">Hendersonville, TN</div>
            </div>
          </div>
          <div className="pc-item">
            <div className="pc-thumb t6">
              <span className="pc-thumb-label">Iron Door</span>
            </div>
            <div className="pc-meta">
              <div className="pc-meta-type">Iron Door</div>
              <div className="pc-meta-loc">Smyrna, TN</div>
            </div>
          </div>
        </div>
        <div className="pc-footer">
          <span className="pc-count">Showing 6 of 24 completed jobs</span>
          <span className="pc-view-all">View all &rarr;</span>
        </div>
      </div>
    </div>
  )
}

export function PortfolioPhoneMockupVisual({ caption }: { caption?: string }) {
  return (
    <div className="phone-outer">
      <div>
        <div className="phone">
          <div className="phone-bar">
            <div className="phone-pill" />
            <div className="phone-cam" />
          </div>
          <div className="phone-screen">
            <div className="mob-head">
              <div className="mob-biz-row">
                <div className="mob-avatar">CI</div>
                <div>
                  <div className="mob-biz-name">Carter&apos;s Iron Doors</div>
                  <div className="mob-biz-sub">Nashville, TN &middot; Est. 2018</div>
                </div>
              </div>
              <div className="mob-call-btn">{phoneIcon} Call</div>
            </div>
            <div className="mob-filters">
              <span className="mob-chip active">All</span>
              <span className="mob-chip passive">Iron</span>
              <span className="mob-chip passive">Wood</span>
              <span className="mob-chip passive">Garage</span>
            </div>
            <div className="mob-grid">
              <div className="mob-item">
                <div className="mob-thumb m1">
                  <span className="pc-thumb-label">Iron Door</span>
                </div>
                <div className="mob-meta">
                  <div className="mob-meta-type">Iron Door</div>
                  <div className="mob-meta-loc">Nashville, TN</div>
                </div>
              </div>
              <div className="mob-item">
                <div className="ba-thumb">
                  <div className="ba-before" />
                  <div className="ba-after" />
                  <div className="ba-line" />
                  <div className="ba-handle" />
                  <span className="ba-label before">Before</span>
                  <span className="ba-label after">After</span>
                </div>
                <div className="mob-meta">
                  <div className="mob-meta-type">Garage Door</div>
                  <div className="mob-meta-loc">Brentwood, TN</div>
                </div>
              </div>
              <div className="mob-item">
                <div className="mob-thumb m3">
                  <span className="pc-thumb-label">Wood Door</span>
                </div>
                <div className="mob-meta">
                  <div className="mob-meta-type">Wood Door</div>
                  <div className="mob-meta-loc">Franklin, TN</div>
                </div>
              </div>
              <div className="mob-item">
                <div className="mob-thumb m4">
                  <span className="pc-thumb-label">Iron Door</span>
                </div>
                <div className="mob-meta">
                  <div className="mob-meta-type">Iron Door</div>
                  <div className="mob-meta-loc">Murfreesboro, TN</div>
                </div>
              </div>
            </div>
            <div className="mob-share">
              {shareIcon}
              Share this portfolio
            </div>
          </div>
        </div>
        {caption && <p className="port-note">{caption}</p>}
      </div>
    </div>
  )
}
