import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'

/**
 * The landing page's "90 Days In" projection section, rendered from Storyblok
 * using styles/landing.css. TEST ONLY — rendered by /landing-preview.
 */

export type AspMetricBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_asp_metric'
  number: string
  suffix?: string
  title: string
  subtitle?: string
}

export type AspirationSectionBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_aspiration_section'
  eyebrow?: string
  heading: string
  body?: string
  metrics?: AspMetricBlock[]
}

export default function StoryblokAspiration({ block }: { block: AspirationSectionBlock }) {
  const metrics = block.metrics ?? []

  return (
    <section className="asp" {...editableProps(block)}>
      <div className="asp-inner">
        <div className="asp-copy">
          {block.eyebrow && <span className="section-label">{block.eyebrow}</span>}
          <h2 style={headingStyle(block)}>{block.heading}</h2>
          {block.body && <p>{block.body}</p>}
        </div>
        {metrics.length > 0 && (
          <div className="asp-metrics">
            {metrics.map((metric) => (
              <div className="asp-m" key={metric._uid} {...editableProps(metric)}>
                <div className="asp-m-num">
                  {metric.number}
                  {metric.suffix && <span>{metric.suffix}</span>}
                </div>
                <div>
                  <div className="asp-m-t" style={bodyStyle(metric)}>
                    {metric.title}
                  </div>
                  {metric.subtitle && <div className="asp-m-s">{metric.subtitle}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
