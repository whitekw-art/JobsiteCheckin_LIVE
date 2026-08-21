import Link from 'next/link'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: 'Why does my competitor have hundreds of reviews when I only have a handful?',
    a: "They've probably been asking consistently for longer, and consistency compounds — a business asking after every job for two years will out-count one asking occasionally, even at similar job volume. Volume itself plays a role too: a landscaping company running twenty jobs a week has more chances to ask than a roofer closing four. And a small share of what's out there is fake or incentivized (Google removed more than 240 million policy-violating reviews in 2024 alone, per its own transparency report), but manipulation alone doesn't explain most of the gap you're likely seeing.",
  },
  {
    q: "Why didn't a customer's review show up on my profile?",
    a: "Most often it's a processing delay of a few days, or in rarer cases a technical issue tied to a recent profile merge or an outdated version of the Maps app on the customer's phone, all of which Google documents on its own support pages. It's a real, common issue, not a sign you did anything wrong.",
  },
  {
    q: 'When should I ask a customer for a Google review?',
    a: "As close to the moment the customer expresses satisfaction with the finished work as you reasonably can, based on both the psychological research on how people remember experiences and how most business owners report it working in practice. If that exact moment doesn't work, asking a day or two later still works for plenty of businesses. The real mistake is waiting so long the job isn't top of mind anymore.",
  },
  {
    q: 'Can I offer a discount for a good review?',
    a: "No. Google's own policy prohibits any incentive tied to leaving a review, and a review earned that way stops being a review of the work.",
  },
]

const TOC = [
  { id: 'ask', label: 'How to Actually Ask' },
  { id: 'frictionless', label: 'Make It Frictionless' },
  { id: 'missing', label: "Find the Reviews You're Already Losing" },
  { id: 'thisweek', label: 'Do This This Week' },
]

const KAHNEMAN_1993 = 'https://journals.sagepub.com/doi/10.1111/j.1467-9280.1993.tb00589.x'
const REDELMEIER_KAHNEMAN_1996 = 'https://www.sciencedirect.com/science/article/abs/pii/0304395996029946'
const PEAK_END_META_ANALYSIS_2022 = 'https://www.sciencedirect.com/science/article/abs/pii/S0749597822000334'
const GOOGLE_TIPS_TO_GET_REVIEWS = 'https://support.google.com/business/answer/3474122'
const GOOGLE_MISSING_DELAYED_REVIEWS = 'https://support.google.com/business/answer/10313341'
const GOOGLE_MAPS_TRANSPARENCY_2024 =
  'https://blog.google/products-and-platforms/products/maps/new-ways-were-protecting-businesses-on-maps/'

/** Every source here is non-commercial or primary: peer-reviewed psychology
 *  research and Google's own documentation. No review-software vendor is
 *  cited or linked — see the source-vetting rule in the blog-writer skill. */
const SOURCES = [
  {
    href: KAHNEMAN_1993,
    label:
      'Kahneman, Fredrickson, Schreiber & Redelmeier, "When More Pain Is Preferred to Less: Adding a Better End"',
    detail: ', Psychological Science 4 (1993).',
  },
  {
    href: REDELMEIER_KAHNEMAN_1996,
    label:
      'Redelmeier & Kahneman, "Patients\' memories of painful medical treatments: real-time and retrospective evaluations of two minimally invasive procedures"',
    detail: ', Pain 66 (1996).',
  },
  {
    href: PEAK_END_META_ANALYSIS_2022,
    label:
      'Alaybek, Dalal et al., "All\'s well that ends (and peaks) well? A meta-analysis of the peak-end rule and duration neglect"',
    detail: ', Organizational Behavior and Human Decision Processes 170 (2022). 174 effect sizes.',
  },
  {
    href: GOOGLE_TIPS_TO_GET_REVIEWS,
    label: 'Google Business Profile Help, "Tips to get more reviews"',
    detail: '.',
  },
  {
    href: GOOGLE_MISSING_DELAYED_REVIEWS,
    label: 'Google Business Profile Help, "About missing or delayed reviews"',
    detail: '.',
  },
  {
    href: GOOGLE_MAPS_TRANSPARENCY_2024,
    label: 'Google, "New ways we\'re protecting businesses on Maps"',
    detail: ' (2024 transparency report — 240M+ reviews and 70M+ edits removed, 12M+ fake profiles blocked).',
  },
]

export default function GoogleReviews2026() {
  return (
    <>
      <p className="blog-lead">
        Your review count is stuck for one main reason: a weak asking system. Most businesses ask
        inconsistently, ask at the wrong moment, and don&rsquo;t wait for the customer to actually
        finish the review in person, then have no follow-up sequence when an in-person ask isn&rsquo;t
        possible. Technical glitches on Google&rsquo;s side, job volume, and outright fraud play a role
        too, but a small one next to how you ask.
      </p>

      <nav className="blog-toc" aria-label="Table of contents">
        <h2>In This Article</h2>
        <ol>
          {TOC.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="blog-section" id="ask">
        <h2>How to Actually Ask</h2>

        <h3>Timing</h3>
        <p>
          There&rsquo;s a real psychological reason job completion is a strong moment to ask, and
          it&rsquo;s worth understanding rather than just following as a rule.{' '}
          <a href={KAHNEMAN_1993} target="_blank" rel="noopener noreferrer">
            Daniel Kahneman and Barbara Fredrickson&rsquo;s research
          </a>{' '}
          on how people evaluate experiences, later confirmed by{' '}
          <a href={REDELMEIER_KAHNEMAN_1996} target="_blank" rel="noopener noreferrer">
            Kahneman and Donald Redelmeier&rsquo;s 1996 study
          </a>{' '}
          of patients rating the pain of medical procedures, found that people don&rsquo;t average out
          an experience when they remember it. They remember two moments: the most intense point, and
          how it ended. Researchers call this the peak-end rule, and a{' '}
          <a href={PEAK_END_META_ANALYSIS_2022} target="_blank" rel="noopener noreferrer">
            2022 meta-analysis of 174 effect sizes
          </a>{' '}
          in <em>Organizational Behavior and Human Decision Processes</em> found consistent support for
          it across the accumulated research.
        </p>
        <p>
          For a door installer, job completion is often both of those moments at once. The customer
          opens the new door for the first time and thanks the crew in the same minute. Relief and
          satisfaction peak right as the interaction ends, which is exactly the combination the
          peak-end rule says will dominate how the customer remembers the whole job later.
        </p>
        <p>
          The same principle plays out differently depending on the job. An emergency call &mdash; a
          burst pipe stopped, an AC running again, a lockout resolved &mdash; puts the peak and the end
          in the same instant, since the problem visibly disappears right as the technician wraps up. A
          planned project like a new roof or a remodel spreads that peak out more. It often lands at
          the final walkthrough, and sometimes again a week or two later once the homeowner has
          actually lived with the result, which gives businesses running planned projects a second real
          window to ask if the first one gets missed.
        </p>
        <p>
          To be fair, no study has directly measured how review-request timing changes actual response
          rates. What the research supports is the mechanism, not a guaranteed number. In practice,
          business owners that kindly ask for reviews in person after a job well done fare better than
          those who wait a day because asking in person feels uncomfortable to them.
        </p>

        <h3>What to Say</h3>
        <p>
          Most homeowners have no idea how much a good review actually does for a small business. They
          know reviews exist, but they don&rsquo;t know that one review can be the difference between a
          customer picking their business or the one three listings above it on Google. That&rsquo;s
          worth saying plainly and kindly, in the moment, not as a tactic, but because it&rsquo;s real
          information the customer doesn&rsquo;t already have.
        </p>
        <p>
          Timing matters as much as the message. If the job went well, the best moment to ask is right
          then, in person, while the crew is still on site. That beats a text sent an hour later or an
          email the next day, because the customer is standing in front of the finished work and
          feeling good about it right now.
        </p>
        <p>
          Most customers who never leave a review simply meant to and then didn&rsquo;t. The day got
          busy, the moment passed, or they ran into the friction of finding and logging into a Google
          account later that night, and the intention quietly died there. Asking in person and closing
          it out on the spot works because it catches that intention while it&rsquo;s still alive,
          before anything gets the chance to interrupt it.
        </p>
        <p>
          The ask should come with a way to finish it on the spot. Pull up the QR code or send the link
          in that same moment, and give the customer a minute to actually leave the review while the
          crew is still there. That&rsquo;s the real reason a QR code or a direct link works as well as
          it does: it lets an in-person ask lead straight to a completed review instead of ending in a
          promise to do it later.
        </p>

        <h3>Keeping It Human</h3>
        <p>
          The businesses that keep review volume flowing over time are usually the ones where asking
          became part of how the crew finishes a job, not a task bolted on afterward. A pest control
          technician who mentions the callback policy in the same breath as the review ask sounds like
          someone doing the job well. A flooring installer who texts three hours after the crew leaves,
          naming the actual color and room, sounds like the same crew that just did the work. Both beat
          a form message sent from an office computer, because the customer can tell the difference.
        </p>
      </section>
      <hr className="blog-divider" />

      <section className="blog-section" id="frictionless">
        <h2>Make It Frictionless</h2>
        <p>
          A verbal ask works best when it comes with a way to finish the review right there, not a
          promise to send something later. The businesses that get stuck with a handful of reviews are
          usually the ones where the ask ends with a vague promise to send the link later, and later
          never comes.
        </p>
        <p>
          A direct link to your Google review page removes the step where a customer has to search for
          your business, find the right listing among two or three similar ones, then find the review
          button. A QR code does the same job at the jobsite itself, taped to a truck or printed on an
          invoice, so the crew can hand it over the moment they ask. Used together, the ask and the link
          aren&rsquo;t two separate tactics. The verbal ask is what gets the customer to say yes, and
          the QR code or link is what lets them actually do it before they walk back inside.
        </p>
        <p>
          One practical pattern for a fence installation crew or a roofer: keep the QR code visible on
          the truck or the invoice, so it&rsquo;s already there the moment the crew finishes walking the
          customer through the finished work. If the customer isn&rsquo;t around to complete it on the
          spot &mdash; they&rsquo;re at work, or the job wraps after they&rsquo;ve already left &mdash; a
          same-day follow-up text with the same link is the fallback, sent while the job is still fresh
          instead of days later.
        </p>
        <p>
          There&rsquo;s a real stopping point here: once the review shows up, once the customer says
          they&rsquo;d rather not be asked again, or after that one same-day follow-up text, whichever
          comes first. Asking again past that point doesn&rsquo;t produce more reviews. It reads as
          pressure, and pressure is what turns a customer who was willing into one who never opens the
          link at all.
        </p>
        <p>
          This is the gap ProjectCheckin&rsquo;s{' '}
          <Link href="/features/review-requests">Review Request feature</Link> is built to close. Once
          a job is marked complete, the app pulls up a pre-filled review request message, still
          editable before it goes out, attached to the business&rsquo;s real Google Business Profile
          review link, and sends it by text or email in one tap. It enables review request tracking,
          dates requests were sent, response rates, ratings, and more. ProjectCheckin also offers a
          dedicated Communications AI assistant to absorb this role for Titan customers.
        </p>
      </section>
      <hr className="blog-divider" />

      <section className="blog-section" id="missing">
        <h2>Find the Reviews You&rsquo;re Already Losing</h2>
        <p>
          Some of the gap between the reviews you&rsquo;ve asked for and the reviews sitting on your
          profile has nothing to do with whether the customer was willing to leave one. Google Business
          Profile Help&rsquo;s own support page,{' '}
          <a href={GOOGLE_MISSING_DELAYED_REVIEWS} target="_blank" rel="noopener noreferrer">
            &ldquo;About missing or delayed reviews,&rdquo;
          </a>{' '}
          lists several real causes that are entirely on Google&rsquo;s side. Standard processing can
          take a few days before a review posts. Recently merging two Business Profiles can cause a
          delay. An older phone or an outdated version of the Maps app can cause a review to fail to
          post at all. And Google states directly that it can temporarily disable reviews for certain
          profiles or business categories, separate from any single review being removed for a policy
          violation.
        </p>
        <p>
          If a customer has told you they left a review and you can&rsquo;t find it, that&rsquo;s worth
          checking rather than assuming they forgot or changed their mind. Ask them to send a screenshot
          of what they submitted. Check whether your profile shows a recent merge or a change to your
          business information, since a merge is a documented trigger for delay. If it&rsquo;s been
          longer than a few days with nothing posted and no merge involved, that&rsquo;s a real case
          worth filing with Google Business Profile support, even though the process can be slow.
        </p>
      </section>
      <hr className="blog-divider" />

      <section className="blog-section" id="thisweek">
        <h2>Do This This Week</h2>
        <p>
          Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
            business.google.com
          </a>{' '}
          and sign into your business profile. Under the option to get more reviews, Google will
          generate both a direct review link and a QR code specific to your listing. Save both. Text
          the direct link to the next three customers whose jobs you&rsquo;ve already finished this
          week, referencing something specific about each job. Print or save the QR code somewhere
          it&rsquo;ll actually get used: on an invoice, on a yard sign, on the tailgate of the truck.
          Check your review count again in two weeks and see what moved.
        </p>
      </section>

      <section className="blog-faq" id="faq">
        <h2>Frequently Asked Questions</h2>
        {FAQ_ITEMS.map((item) => (
          <div className="blog-faq-item" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>

      <section className="blog-sources">
        <h2>Sources</h2>
        <ul>
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
              {source.detail}
            </li>
          ))}
        </ul>
      </section>

      <div className="blog-cta">
        <h2>Turn Every Finished Job Into a Review Request That Actually Gets Sent</h2>
        <p>
          ProjectCheckin pre-fills a review request the moment a job is marked complete, attached to
          your real Google review link, ready to send by text or email in one tap.
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
        </div>
      </div>
    </>
  )
}
