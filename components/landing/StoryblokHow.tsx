import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'
import { HowVisual } from './HowVisuals'

/**
 * The landing page's "How It Works" section, rendered from Storyblok using
 * styles/landing.css so it matches the live page. TEST ONLY — rendered by
 * /landing-preview.
 */

export type HowStepBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_how_step'
  step_label: string
  heading: string
  body?: string
  bullets?: string
  visual?: string
}

export type HowSectionBlock = {
  _uid: string
  _editable?: string
  component: 'lp_how_section'
  eyebrow?: string
  steps?: HowStepBlock[]
}

const lines = (value: string | undefined): string[] =>
  (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

function HowStep({ step, index }: { step: HowStepBlock; index: number }) {
  const bullets = lines(step.bullets)

  return (
    <div className={`how-step${index % 2 === 1 ? ' flip' : ''}`} {...editableProps(step)}>
      <div className="hs-copy">
        <div className="hs-step-n">{step.step_label}</div>
        <h3 style={headingStyle(step)}>{step.heading}</h3>
        {step.body && <p style={bodyStyle(step)}>{step.body}</p>}
        {bullets.length > 0 && (
          <div className="hs-bullets">
            {bullets.map((item) => (
              <div className="hs-b" key={item}>
                <span className="hs-b-dot"></span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hs-visual">
        <HowVisual kind={step.visual} />
      </div>
    </div>
  )
}

export default function StoryblokHow({ block }: { block: HowSectionBlock }) {
  const steps = block.steps ?? []
  if (steps.length === 0) return null

  return (
    <section className="how" id="how-it-works" {...editableProps(block)}>
      <div className="how-inner">
        <div className="how-head">
          {block.eyebrow && <span className="section-label">{block.eyebrow}</span>}
        </div>
        <div className="how-steps">
          {steps.map((step, i) => (
            <HowStep step={step} index={i} key={step._uid} />
          ))}
        </div>
      </div>
    </section>
  )
}
