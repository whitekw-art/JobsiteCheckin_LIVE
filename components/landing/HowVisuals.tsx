/**
 * The pictures shown beside each "How It Works" step. COPIES of markup
 * currently inline in components/LandingPage.tsx, deliberately duplicated
 * rather than extracted so the live landing page stays untouched while
 * Storyblok editing is being evaluated. See the note in BentoVisuals.tsx.
 *
 * TEST ONLY — rendered by /landing-preview.
 */

export function CheckinPhotoVisual() {
  return (
    <div className="step-photo-wrap">
      <img src="/images/lp-contractor-checkin.png" alt="Field crew checking in at job site" />
      <div className="step-photo-badge">
        <span className="spb-dot"></span>
        <div>
          <div className="spb-text">Check-In Submitted</div>
          <div className="spb-sub">4 photos &middot; Nashville, TN</div>
        </div>
      </div>
    </div>
  )
}

export function DashboardJobVisual() {
  return (
    <div className="dash-mockup">
      <div className="dm-chrome">
        <div className="dm-logo">
          <img src="/logo.png" className="dm-logo-img" alt="" />
          <span className="dm-logo-text">ProjectCheckin</span>
        </div>
        <button className="dm-new-btn">+ New Check-In</button>
      </div>
      <div className="dm-status-bar">
        <span className="dm-status-dot"></span>
        Your public portfolio is live &mdash; 5 jobs indexed on Google
        <span className="dm-view-portfolio">View Portfolio &#8599;</span>
      </div>
      <div className="dm-job-header">
        <div className="dm-date">
          <div className="dm-date-mon">APR</div>
          <div className="dm-date-day">18</div>
        </div>
        <div className="dm-job-meta">
          <div className="dm-job-addr">412 Maple Creek Dr., Brentwood, TN 37027</div>
          <div className="dm-job-type">
            Wood Door &middot; <span className="dm-photos-link">4 photos</span>
          </div>
        </div>
        <div className="dm-live-wrap">
          <span className="dm-live-dot"></span>
          <span className="dm-live-text">Live</span>
        </div>
        <button className="dm-unpublish-btn">Unpublish</button>
      </div>
      <div className="dm-job-body">
        <div className="dm-col-left">
          <div className="dm-section">
            <div className="dm-section-label">
              Customer <span className="dm-edit-link">Edit</span>
            </div>
            <div className="dm-customer-name">Jennifer Jones</div>
            <div className="dm-field-row">
              <span className="dm-field-lbl">Phone</span>(615) 555-0100
            </div>
            <div className="dm-field-row">
              <span className="dm-field-lbl">Email</span>j.jones@example.com
            </div>
          </div>
          <div className="dm-section">
            <div className="dm-section-label">Address</div>
            <div className="dm-addr-text">
              412 Maple Creek Dr.
              <br />
              Brentwood, TN 37027
            </div>
            <div className="dm-maps-link">Open in Maps &#8599;</div>
          </div>
        </div>
        <div className="dm-col-right">
          <div className="dm-photos-grid">
            <img src="/images/dm-job-photo-1.png" alt="" />
            <img src="/images/dm-job-photo-2.png" alt="" />
            <img src="/images/dm-job-photo-3.png" alt="" />
            <img src="/images/dm-job-photo-4.png" alt="" />
          </div>
          <div className="dm-actions">
            <button className="dm-action-btn">
              <span className="dm-action-icon">&#128279;</span>Copy Job Link
            </button>
            <button className="dm-action-btn dm-action-gbp">
              <span className="dm-action-icon">&#128205;</span>Post to Google Business
            </button>
            <button className="dm-action-btn dm-action-review">
              <span className="dm-action-icon">&#11088;</span>Request Google Review
            </button>
          </div>
        </div>
      </div>
      <div className="dm-user-badge">
        <div className="dm-user-avatar"></div>
        <span className="dm-user-plan">Titan Plan</span>
      </div>
    </div>
  )
}

const JOB_ROWS = [
  { mon: 'APR', day: 23, addr: '1847 Willowmist Crossing Dr, Franklin, TN 37064', type: 'Fiberglass Front Door · 4 photos', live: false },
  { mon: 'APR', day: 22, addr: '3214 Copperbend Hollow Ln, Brentwood, TN 37027', type: 'Barn Door · 3 photos', live: true },
  { mon: 'APR', day: 22, addr: '509 Fernbrook Hollow Ct, Murfreesboro, TN 37129', type: 'Barn Door · 5 photos', live: false },
  { mon: 'APR', day: 21, addr: '721 Stonewick Meadows Dr, Spring Hill, TN 37174', type: 'Barn Door · 2 photos', live: true },
  { mon: 'APR', day: 18, addr: '412 Maple Creek Dr, Brentwood, TN 37027', type: 'Wood Door · 4 photos', live: true },
  { mon: 'APR', day: 10, addr: '2816 Bluegrass Summit Ave, Nashville, TN 37211', type: 'Iron Door · 2 photos', live: false },
]

export function DashboardListVisual() {
  return (
    <div className="dash-mockup">
      <div className="dm-wrapper">
        <div className="dm-sidebar">
          <div className="dm-sidebar-logo">
            <img src="/logo.png" className="dm-logo-img" alt="" />
            <span className="dm-logo-text">ProjectCheckin</span>
          </div>
          <div className="dm-nav">
            <div className="dm-nav-section-lbl">Workspace</div>
            <div className="dm-nav-item">Check-In</div>
            <div className="dm-nav-item active">Jobs</div>
            <div className="dm-nav-item">Team</div>
            <div className="dm-nav-section-lbl">Analytics</div>
            <div className="dm-nav-item">Reporting</div>
            <div className="dm-nav-section-lbl">Settings</div>
            <div className="dm-nav-item">Account</div>
            <div className="dm-nav-item">Sign Out</div>
          </div>
          <div className="dm-sidebar-user">
            <div className="dm-user-avatar"></div>
            <span className="dm-user-plan">Titan Plan</span>
          </div>
        </div>
        <div className="dm-main">
          <div className="dm-main-header">
            <span className="dm-main-title">Jobs</span>
            <button className="dm-new-btn">+ New Check-In</button>
          </div>
          <div className="dm-stats-bar">
            <div className="dm-stat">
              <div className="dm-stat-n">34</div>
              <div className="dm-stat-l">Total Jobs</div>
            </div>
            <div className="dm-stat">
              <div className="dm-stat-n">3</div>
              <div className="dm-stat-l">Today</div>
            </div>
            <div className="dm-stat">
              <div className="dm-stat-n">28</div>
              <div className="dm-stat-l">Published</div>
            </div>
            <div className="dm-stat">
              <div className="dm-stat-n">6</div>
              <div className="dm-stat-l">Active Installers</div>
            </div>
          </div>
          <div className="dm-status-bar">
            <span className="dm-status-dot"></span>
            Your public portfolio is live &mdash; 28 jobs indexed on Google
            <span className="dm-view-portfolio">View Portfolio &#8599;</span>
          </div>
          <div className="dm-filters">
            <div className="dm-tabs">
              <div className="dm-tab active">
                All <span className="dm-tab-count">34</span>
              </div>
              <div className="dm-tab">
                Live <span className="dm-tab-count">28</span>
              </div>
              <div className="dm-tab">
                Draft <span className="dm-tab-count">6</span>
              </div>
            </div>
          </div>
          <div className="dm-job-list">
            {JOB_ROWS.map((row, i) => (
              <div className="dm-list-row" key={i}>
                <div className="dm-list-date">
                  <div className="dm-list-date-mon">{row.mon}</div>
                  <div className="dm-list-date-day">{row.day}</div>
                </div>
                <div className="dm-list-meta">
                  <div className="dm-list-addr">{row.addr}</div>
                  <div className="dm-list-type">{row.type}</div>
                </div>
                <div className="dm-list-right">
                  {row.live ? (
                    <>
                      <div className="dm-list-live">
                        <span className="dm-list-dot live"></span>Live
                      </div>
                      <button className="dm-list-unpublish">Unpublish</button>
                    </>
                  ) : (
                    <>
                      <div className="dm-list-draft">
                        <span className="dm-list-dot draft"></span>Draft
                      </div>
                      <button className="dm-list-publish">Publish</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HowVisual({ kind }: { kind?: string }) {
  if (kind === 'checkin_photo') return <CheckinPhotoVisual />
  if (kind === 'dashboard_job') return <DashboardJobVisual />
  if (kind === 'dashboard_list') return <DashboardListVisual />
  return null
}
