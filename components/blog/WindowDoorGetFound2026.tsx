import Link from 'next/link'
import BlogCta from '@/components/blog/BlogCta'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: 'Is the window and door tax credit really gone for 2026?',
    a: 'Yes. The IRS states the Energy Efficient Home Improvement Credit applied to qualifying property placed in service before December 31, 2025. For anything installed in 2026 there is no federal 25C credit to claim. Check for state and local utility rebates in your market, because several of those still exist and homeowners rarely know about them.',
  },
  {
    q: 'How long before this shows up in search results?',
    a: 'Google Business Profile activity tends to move fastest, sometimes within weeks. Job pages and question-answering content build more slowly and keep compounding as you add more, which is why starting during a slower month beats starting when you need calls next week. Nobody can promise a ranking or a timeline, including anyone who tells you otherwise.',
  },
  {
    q: 'Does this work for service calls, or only replacement jobs?',
    a: 'Both, through different pages. Repair searches like “garage door won’t open” or “broken torsion spring” convert in hours and reward a complete profile, an obvious phone number, and clear service-area coverage. Replacement searches convert over months and reward documented jobs and detailed answers. Build for both, because the service side pays this week and the replacement side pays for the year.',
  },
  {
    q: 'Do I need to hire an agency for this?',
    a: 'No. Everything in this article is work you or somebody in your office can do, and the tools involved are free. An agency can save you time, but the raw material is a photo of a finished install and a straight answer to a question you already answer daily, and neither of those can be outsourced to somebody who has never been in one of your customers’ homes.',
  },
  {
    q: 'How many photos do we actually need per job?',
    a: 'Fewer than you think, as long as they are real. A shot of the finished install, one showing the product clearly, and a before photo if somebody remembered to take one covers most of it. What matters more than volume is that the photos are current, tied to a real address, and taken on jobs your own crew completed.',
  },
]

const TOC = [
  { id: 's1', label: 'What Changed in 2026' },
  { id: 's2', label: 'Homeowners Take Almost a Year to Decide' },
  { id: 's3', label: 'The Trust Problem Is in the Selling, Not the Product' },
  { id: 's4', label: 'Two Kinds of Searches, and Most Companies Only Chase One' },
  { id: 'f1', label: '1. Show the Work at the Address, Not in a Gallery' },
  { id: 'f2', label: '2. Answer the Questions Homeowners Ask Before They Call' },
  { id: 'f3', label: '3. Keep Your Google Business Profile Alive Between Jobs' },
]

/** HIRI's reasons-for-replacing data. Homeowners pick more than one, so these
 *  overlap rather than summing to 100 — the figure says so explicitly. */
const REPLACEMENT_REASONS = [
  { label: 'Energy efficiency', pct: 60 },
  { label: 'Maintenance or repair need', pct: 48 },
  { label: 'Comfort and livability', pct: 47 },
  { label: 'Appearance', pct: 45 },
  { label: 'Home value', pct: 41 },
  { label: 'Safety and security', pct: 36 },
]

const IRS_25C = 'https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit'
const JCHS = 'https://www.jchs.harvard.edu/research-areas/remodeling'
const HIRI = 'https://www.hiri.org/blog/window-market-watch'
const JD_POWER =
  'https://www.windowanddoor.com/news/window-and-patio-door-satisfaction-holds-steady-2026-rising-prices-erode-perceived-value'
const ZONDA = 'https://zondahome.com/2025-cost-vs-value-report/'
const GBP = 'https://business.google.com'

/** All sources are primary/official, academic, or industry research bodies.
 *  No SEO or marketing vendor is cited or linked. */
const SOURCES = [
  { href: IRS_25C, label: 'Internal Revenue Service, Energy Efficient Home Improvement Credit', detail: '.' },
  {
    href: JCHS,
    label: 'Harvard University Joint Center for Housing Studies, Leading Indicator of Remodeling Activity',
    detail: ', January 2026 release.',
  },
  { href: HIRI, label: 'Home Improvement Research Institute, window market analysis', detail: ', June 19, 2026.' },
  {
    href: JD_POWER,
    label: 'J.D. Power, 2026 U.S. Windows and Patio Doors Satisfaction Study',
    detail: ', published August 10, 2026.',
  },
  {
    href: ZONDA,
    label: 'Zonda, Cost vs. Value Report',
    detail: ', 38th annual edition, published September 18, 2025.',
  },
]

export default function WindowDoorGetFound2026() {
  return (
    <>
      <p className="blog-lead">
        Homeowners find window, door, and garage door companies through Google Search, Google Maps,
        and AI answers, and most of them check on you several times before they ever call. Getting
        found comes down to three things: a complete and active Google Business Profile, pages that
        answer the questions homeowners actually type, and current photo proof of real installs near
        them.
      </p>

      <p>
        2026 is a different selling year than the last three. The federal tax credit that closed a
        lot of hesitant buyers ended with the 2025 tax year, and remodeling spending is still growing
        but growing slower. That combination means fewer jobs arriving on their own. The work you win
        this year mostly comes out of somebody else’s pipeline, and the deciding factor is usually
        which company the homeowner could find, read about, and believe.
      </p>

      <p>
        The three trades in that headline sell differently, so it is worth saying up front which
        parts apply to whom. Replacement windows and entry doors are long-consideration purchases
        where the research below about a ten-month decision applies directly. Garage doors split in
        two: replacement behaves like a window sale, while spring and opener failures are emergencies
        that get decided in an afternoon. If you do service work as well as replacement, the section
        on the two kinds of searches is the one to read twice.
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

      <section className="blog-section" id="s1">
        <h2>What Changed in 2026</h2>
        <p>
          The Energy Efficient Home Improvement Credit, Section 25C, is over.{' '}
          <a href={IRS_25C} target="_blank" rel="noopener noreferrer">
            The IRS states
          </a>{' '}
          the credit applied to qualifying property placed in service on or after January 1, 2023,
          and before December 31, 2025. At its peak it was worth up to $600 total for exterior
          windows and skylights, and $250 per exterior door with a $500 cap on doors. That was never
          enough money to sell a $14,000 job by itself, but it was the nudge that moved a fence-sitter
          from “next spring” to “let’s do it.” For the 2026 selling season that nudge is gone, and the
          rep in the home has to close on value alone.
        </p>
        <p>
          The broader market is doing the same thing more slowly.{' '}
          <a href={JCHS} target="_blank" rel="noopener noreferrer">
            Harvard’s Joint Center for Housing Studies
          </a>
          , in its January 2026 Leading Indicator of Remodeling Activity, projects remodeling and
          repair spending growth easing from 2.9% in the first quarter of 2026 down to 1.6% by the
          fourth quarter, on roughly $522 billion in spending for the year. That is still a large
          market and it is still growing. It just is not growing fast enough to hand anybody extra
          volume.
        </p>
        <p>
          There is one piece of good news, and it is worth carrying into every estimate you run.{' '}
          <a href={ZONDA} target="_blank" rel="noopener noreferrer">
            Zonda’s Cost vs. Value Report
          </a>{' '}
          — the 38th annual edition, published September 2025 and still the current one — puts garage
          door replacement at 267.7% of cost recouped, on a national average job cost of $4,672
          against $12,507 in added resale value. It ranked first in all nine U.S. regions. Steel entry
          door replacement came in second at 216.4%, $2,435 in cost against $5,270 in value. Eight of
          the top ten projects in that report are exterior replacements.
        </p>
        <p>
          Those two numbers are a selling tool most companies leave sitting on the table. A homeowner
          weighing a garage door against a bathroom remodel is looking at the highest-return project
          in the country versus one near the bottom of the list, and almost nobody tells them that in
          plain terms.
        </p>
        <p>
          What all of this means on the ground is straightforward. The market is not going to hand you
          volume this year, so the jobs go to whoever is easiest to find and easiest to believe.
        </p>
      </section>

      <section className="blog-section" id="s2">
        <h2>Homeowners Take Almost a Year to Decide</h2>
        <p>
          The{' '}
          <a href={HIRI} target="_blank" rel="noopener noreferrer">
            Home Improvement Research Institute
          </a>
          , in analysis dated June 19, 2026, found that homeowners take an average of 46.3 weeks to
          move through a window replacement decision. That is roughly ten and a half months from the
          first “these windows are shot” thought to a signed contract. Decision-making peaks in May
          and June, which means the homeowner who signs in June has usually been quietly looking since
          the previous summer.
        </p>
        <p>HIRI also asked why homeowners replace, and the reasons stack rather than compete.</p>

        <figure
          className="blog-fig"
          role="group"
          aria-label="Chart: why homeowners say they replace their windows. Energy efficiency 60 percent, maintenance or repair need 48 percent, comfort and livability 47 percent, appearance 45 percent, home value 41 percent, safety and security 36 percent."
        >
          <div className="blog-fig-title">Why homeowners say they replace their windows</div>
          <div className="blog-fig-sub">
            Homeowners select more than one reason, so these overlap rather than dividing a total.
          </div>
          {REPLACEMENT_REASONS.map((reason) => (
            <div className="blog-bar-row" key={reason.label}>
              <div className="blog-bar-label">{reason.label}</div>
              <div className="blog-bar-track">
                <div className="blog-bar-rail">
                  <div className="blog-bar-fill" style={{ width: `${reason.pct}%` }} />
                </div>
                <div className="blog-bar-val">{reason.pct}%</div>
              </div>
            </div>
          ))}
          <div className="blog-fig-axis">
            <span>0%</span>
            <span>100% of homeowners</span>
          </div>
          <figcaption className="blog-fig-source">
            Source: Home Improvement Research Institute, window market analysis dated June 19, 2026.
          </figcaption>
        </figure>

        <p>
          Nobody is deciding on one reason. A homeowner is usually stacking three or four of these
          before they call anyone, which is why a page that only talks about U-factor and low-E glass
          leaves most of the motivation on the table. The person who wants their west-facing living
          room to stop cooking every afternoon is buying comfort, and the glass package is just how
          you deliver it.
        </p>
        <p>
          The stakes are high enough to matter. HIRI found that 82% of window installations on
          projects over $5,000 are done by professionals, and the average window and door project runs
          about $14,000 with a median of $10,000. A single window replacement lands somewhere between
          $450 and $1,500. On projects that size the homeowner is not shopping for a weekend project.
          They are shopping for a company.
        </p>
        <p>
          Here is the practical conclusion. A single ad, a one-time mailer, or a burst of activity in
          March cannot cover a ten-month decision window. The homeowner will look you up in September,
          forget about it, look again in January, and look one more time in May before they call. A
          growing body of documented work covers that whole stretch, because it keeps adding something
          new for them to find every time they come back.
        </p>
      </section>

      <section className="blog-section" id="s3">
        <h2>The Trust Problem Is in the Selling, Not the Product</h2>
        <p>
          The most interesting number this year comes from the{' '}
          <a href={JD_POWER} target="_blank" rel="noopener noreferrer">
            J.D. Power 2026 U.S. Windows and Patio Doors Satisfaction Study
          </a>
          , published August 10, 2026. Average price paid rose $147 year over year to $5,805. On J.D.
          Power’s 1,000-point scale, value perception fell 8 points for products and 19 points for
          retailers. Satisfaction with product durability actually rose 8 points.
        </p>
        <p>
          Read that carefully, because it is not the story most people assume. The windows got better.
          Homeowners are more satisfied with how the product holds up than they were a year ago. What
          dropped, and dropped more than twice as hard, was how homeowners feel about the companies
          selling and installing them.
        </p>
        <p>
          That is a specific kind of doubt and it deserves a specific answer. A homeowner who trusts
          the glass but does not trust the seller is not asking whether triple-pane is worth it. They
          are asking whether the measure will be right, whether the price on the contract is the price
          they pay, whether the crew shows up when the order comes in, and whether anybody answers the
          phone if a sash does not operate right in February.
        </p>
        <p>
          A product brochure does not answer any of that. Evidence of finished work does: real jobs,
          in real neighborhoods, with photos of the actual install and a date on them. Proof of
          completed work speaks to the exact doubt the J.D. Power data identified. It shows the crew
          is real, the work gets done, and people nearby have already been through it.
        </p>
      </section>

      <section className="blog-section" id="s4">
        <h2>Two Kinds of Searches, and Most Companies Only Chase One</h2>
        <p>
          There is an asymmetry in this trade that costs companies real money. If you do both service
          and replacement, you have to win two completely different kinds of search, and most
          companies only build for one.
        </p>
        <p>
          The first kind is the emergency, and in this trade it is mostly garage doors. Somebody hears
          a loud bang from the garage, walks out, and the door will not lift. It suddenly feels far
          heavier than it should by hand, or it rises a few inches and reverses. That homeowner is
          typing “garage door won’t close,” “broken garage door spring,” “garage door off track,” or
          “garage door sensor not working” into their phone from the driveway, and they are calling
          whoever comes up first and looks legitimate. The same thing happens with a patio door that
          has stopped rolling or an entry door that will not latch after a cold snap. These searches
          convert in hours, sometimes minutes, with almost no deliberation. What that person needs to
          see is that you are real, you are local, and somebody will pick up right now.
        </p>
        <p>
          The second kind is the project, and it covers most window and entry door work. “Replacement
          windows near me,” “window replacement cost,” “energy efficient windows,” “double pane window
          replacement,” “front door replacement,” “entry door installation,” “patio door replacement,”
          “storm door installation,” and in coastal markets “hurricane impact windows.” Add your city
          to any of those and you have the phrase your best-fit customer is actually typing. These are
          the ten-month searches. Nobody calls on the first one. They read, they close the tab, and
          they come back in six weeks.
        </p>
        <p>
          These two need different content and different proof. The emergency searcher needs a phone
          number, a service area, and enough recent activity that you obviously exist. The project
          searcher needs cost ranges, comparisons, install-day expectations, and a growing pile of
          finished jobs they can look at over the better part of a year. A garage door company that
          builds only for the emergency side keeps the service truck busy and never sees the
          replacement volume sitting in the same neighborhoods. A window company that builds only for
          the project side leaves fast, high-margin service calls to whoever picked up first.
        </p>
      </section>

      <div className="blog-leadin">
        <p>
          The three moves below are not a complete list of everything you could do online. They are
          the ones that pay off fastest for this specific trade, given how homeowners shop for windows
          and doors and how long they take to decide.
        </p>
      </div>

      {/* ── 01 ── */}
      <section className="blog-factor" id="f1">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">
            01
          </div>
          <div className="blog-factor-titlewrap">
            <h2>Show the Work at the Address, Not in a Gallery</h2>
          </div>
        </div>
        <div className="blog-factor-body">
          <h3>What This Looks Like</h3>
          <p>
            Most window and door company websites have a photo gallery. Twenty or thirty pictures, and
            not one of them says where it was taken, when, or what went in. A homeowner scrolling that
            gallery cannot tell whether those jobs were last month or in 2019, whether they were
            within twenty miles or three states away, or whether your crew did them at all. A gallery
            proves you own a camera.
          </p>
          <p>
            Job-level proof works differently. Each finished install gets its own page tied to the
            actual neighborhood or street, with the real photos your crew took, the product that
            actually went in, and the date it happened. A homeowner in that subdivision searching for
            a front door replacement can see a job you did four streets over, in a house built the
            same year as theirs, with the same jamb condition and the same trim problem. That is the
            difference between “this company does doors” and “this company does doors on my street.”
          </p>
          <p>
            It also does something for search that a gallery never will. Every job page carries the
            city, the product, and the service in real text on a real page, which is exactly what
            somebody typing “patio door replacement” plus their city is looking for. Do enough of them
            and you cover your service area one address at a time.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Pick your last ten completed installs. For each one, write down the city, the product that
            went in (full-frame or insert, the door style, the glass package), and one sentence about
            what the job actually involved. Pull the photos your crew already took off their phones.
            Then put each job on its own page on your website with that information on it, rather than
            dumping all the photos into one gallery. Any website builder you already pay for will let
            you add pages, so this is a time cost rather than a software purchase. If your crew is not
            photographing finished work consistently yet, that habit comes first, because everything
            else here depends on it. Once the habit exists and ten pages turn into a hundred,{' '}
            <Link href="/features/local-job-pages">Local Job Pages</Link> is how we handle the
            page-building part from a check-in the crew does on their phone.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 02 ── */}
      <section className="blog-factor" id="f2">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">
            02
          </div>
          <div className="blog-factor-titlewrap">
            <h2>Answer the Questions Homeowners Ask Before They Call</h2>
          </div>
        </div>
        <div className="blog-factor-body">
          <h3>What This Looks Like</h3>
          <p>
            A homeowner ten months into a window decision has a specific list of questions, and almost
            none of them are answered anywhere on the average window company’s website. What does a
            full-frame replacement actually cost compared to an insert, and why would I need
            full-frame at all? How long from signed contract to installed windows? What happens on
            install day, and does somebody need to be home the whole time? Do I have to move the
            furniture? What does the warranty actually cover, the labor or only the glass? How long
            until the trim and the paint look finished?
          </p>
          <p>
            The companies that answer those questions plainly, on their own website, in the customer’s
            own words, get two things at once. Homeowners spend longer on the site and come back to
            it, because it is genuinely useful. And when somebody types the question into Google or
            asks an AI assistant, a page that answers the question directly is the kind of page that
            gets pulled as the answer.
          </p>
          <p>
            Write the heading the way the homeowner says it. “How much does window replacement cost?”
            works. “Investment Considerations” does not. Then answer it in two or three plain
            sentences with a real range, before any qualifying.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Write down the questions you get asked in every single in-home estimate. If you have sales
            reps, ask your best two and compare lists; if you are the one running the estimates, you
            already know them. Either way you will land on eight to twelve, and they will be the same
            eight to twelve every time. Put each one on your site as a heading, worded exactly as a
            homeowner would say it, with a direct answer underneath. Give real cost ranges, even if
            they are wide, and explain what moves a job to the high end. A homeowner who gets a
            straight number from you before the appointment shows up already trusting you more than
            the company that made them fill out a form to find out.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 03 ── */}
      <section className="blog-factor" id="f3">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">
            03
          </div>
          <div className="blog-factor-titlewrap">
            <h2>Keep Your Google Business Profile Alive Between Jobs</h2>
          </div>
        </div>
        <div className="blog-factor-body">
          <h3>What This Looks Like</h3>
          <p>
            Your Google Business Profile is the box that shows up in Maps and in the local results
            with your hours, phone number, photos, and reviews. For emergency searches it is
            frequently the only thing a homeowner looks at before dialing. For project searches it is
            the first place they check to see whether you are still in business and whether anybody
            has said anything about you recently.
          </p>
          <p>
            A profile that has not been touched in two years reads like a company that might not be
            there anymore. The photos are old, the service list still mentions something you stopped
            offering, and the last activity was whenever somebody set it up. An active profile reads
            as a company that is currently working. That means posting consistently, keeping the
            service list accurate to what you actually sell today, and adding fresh photos as jobs
            finish.
          </p>
          <p>
            Nothing about this guarantees a ranking. It is simply that the profile is where homeowners
            look, and a current one earns calls that a stale one does not.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Sign into your profile at{' '}
            <a href={GBP} target="_blank" rel="noopener noreferrer">
              business.google.com
            </a>{' '}
            and do three things. Read your service list top to bottom and fix anything inaccurate or
            missing, using the words homeowners use rather than internal product names. Add photos
            from your last five jobs. Then post something, and set a schedule you can actually hold,
            even if that is once a week. All of that is free and takes about twenty minutes. If
            holding the weekly habit through a busy summer is the part that slips, our{' '}
            <Link href="/features/gbp-post-generator">GBP Post Generator</Link> builds the post from a
            job the crew already checked in.
          </p>
        </div>
      </section>

      <div className="blog-closing">
        <h2>Where This Leaves You</h2>
        <p>
          The 25C credit is not coming back, and the market is going to grow at the pace Harvard’s
          numbers say it will. Those are the conditions for the year, and they are exactly the same
          for the company across town.
        </p>
        <p>
          What is genuinely on your side is the time. A homeowner who takes 46.3 weeks to decide is a
          homeowner who gives you 46.3 weeks to be found. That is a long runway, and it belongs to
          whoever is still showing up when they check the third and fourth time. The company with
          forty documented jobs from the last year, a profile that shows current activity, and
          straight answers to the questions everybody asks looks like the safer choice next to the
          company with a 2019 gallery and a contact form.
        </p>
        <p>
          That will not happen quickly and it will not happen from one push. It happens because the
          crew photographs finished work, somebody puts it where homeowners can see it, and the
          profile stays current. The J.D. Power data says homeowners have gotten more skeptical of the
          people selling windows and doors. Real, current, verifiable work is the most direct answer
          anybody has to that.
        </p>
      </div>

      <section className="blog-faq">
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

      <BlogCta source="blog/window-door-companies-get-found-2026" />
    </>
  )
}
