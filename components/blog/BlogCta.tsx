import AuditRequestModal from '@/components/blog/AuditRequestModal'

/**
 * Evergreen closing block for every blog post.
 *
 * Written to stand alone: it never refers back to the article above it,
 * so it reads correctly no matter which post it's attached to.
 */
export default function BlogCta({ source }: { source: string }) {
  return (
    <div className="blog-cta">
      <h2>Turn Finished Jobs Into New Business</h2>
      <p>
        ProjectCheckin turns every completed job into a page that helps the next customer find
        you, built the way search engines and AI tools actually read pages. See it in action, or
        check where your own site stands right now.
      </p>
      <div className="blog-cta-row">
        <a
          href="https://calendly.com/projectcheckin-/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="blog-btn"
        >
          Book a Demo
        </a>
        <AuditRequestModal source={source} />
      </div>
    </div>
  )
}
