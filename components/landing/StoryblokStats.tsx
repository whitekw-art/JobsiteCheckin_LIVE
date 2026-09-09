import { bodyStyle, editableProps, type TextStyleFields } from '@/lib/storyblok'

/**
 * The landing page's stats bar, rendered from Storyblok using styles/landing.css
 * so it matches the live page. TEST ONLY — rendered by /landing-preview.
 */

export type StatItem = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_stat_item'
  number: string
  label: string
  source?: string
}

export type StatsSectionBlock = {
  _uid: string
  _editable?: string
  component: 'lp_stats_section'
  stats?: StatItem[]
}

export default function StoryblokStats({ block }: { block: StatsSectionBlock }) {
  const stats = block.stats ?? []
  if (stats.length === 0) return null

  return (
    <section className="stats" {...editableProps(block)}>
      <div className="stats-inner">
        {stats.map((stat) => (
          <div className="stat" key={stat._uid} {...editableProps(stat)}>
            <span className="stat-n">{stat.number}</span>
            <div className="stat-lbl" style={bodyStyle(stat)}>
              {stat.label}
            </div>
            {stat.source && <div className="stat-src">{stat.source}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}
