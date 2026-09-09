/**
 * The fake browser-window mockup shown in the Local Job Pages hero. COPY of
 * markup currently inline in components/LocalJobPages.tsx, deliberately
 * duplicated so the live feature page stays untouched — see the note in
 * components/landing/BentoVisuals.tsx for why. TEST ONLY.
 */

export type JobPageMockupProps = {
  url?: string
  photo?: string
  photoAlt?: string
  chip?: string
  title?: string
  meta?: string
  desc?: string
}

export default function JobPageMockupVisual({
  url,
  photo,
  photoAlt,
  chip,
  title,
  meta,
  desc,
}: JobPageMockupProps) {
  return (
    <div>
      <div className="browser-frame">
        <div className="browser-chrome">
          <div className="browser-dots">
            <div className="browser-dot red" />
            <div className="browser-dot amber" />
            <div className="browser-dot green" />
          </div>
          <div className="browser-url">{url || 'projectcheckin.com/jobs/example'}</div>
        </div>

        <div className="jp-photo">
          {photo && <img src={photo} alt={photoAlt ?? ''} />}
          <div className="jp-back">← Back to Portfolio</div>
        </div>

        <div className="jp-body">
          <div>
            {chip && <div className="jp-chip">{chip}</div>}
            {title && <div className="jp-title">{title}</div>}
            {meta && <div className="jp-meta">{meta}</div>}
            {desc && <div className="jp-desc">{desc}</div>}
          </div>
          <div className="jp-card">
            <div className="jp-card-name">YOUR COMPANY NAME</div>
            <div className="jp-card-btn">Free Estimate</div>
            <div className="jp-card-sub">Visit Website</div>
          </div>
        </div>

        <div className="jp-divider" />
        <div className="jp-more-label">More Projects by YOUR COMPANY NAME</div>
        <div className="jp-grid">
          <div className="jp-thumb">
            <img src="/images/jp-thumb-wood-door.png" alt="Wood door installation" />
          </div>
          <div className="jp-thumb">
            <img src="/images/jp-thumb-fiberglass-door.png" alt="Fiberglass front door replacement" />
          </div>
          <div className="jp-thumb">
            <img src="/images/jp-thumb-iron-door-1.png" alt="Iron door installation" />
          </div>
          <div className="jp-thumb">
            <img src="/images/jp-thumb-iron-door-2.png" alt="Iron door installation" />
          </div>
        </div>

        <div className="jp-footer">
          <div className="jp-footer-title">Need a job done? Get a free estimate.</div>
          <div className="jp-footer-btns">
            <span className="jp-footer-btn orange">Free Estimate</span>
            <span className="jp-footer-btn ghost">Visit Website</span>
          </div>
        </div>
      </div>
    </div>
  )
}
