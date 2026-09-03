import Link from 'next/link'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: "Why isn't my Google Business Profile showing up when I search for it?",
    a: 'Search your exact business name plus your city, signed out of your Google account, on both Google Search and Google Maps. If your business appears for that search but never appears for searches describing the work you perform, the profile is live and the remaining problem is competitive ranking. If your business appears in neither place, check verification status first, because Google states that only verified businesses show their information on Maps and Search.',
  },
  {
    q: 'Why is my business not showing up on Google Maps after verification?',
    a: 'The most common explanation is that insufficient time has passed since verification. Google states that rankings for new businesses can take up to a month to appear in search results. If more than a month has elapsed, work through the completeness items instead, covering your primary category, your services list, your hours, and whether your address and service area are configured the way Google describes for a business that travels to customers.',
  },
  {
    q: 'How long does it take for a Google Business Profile to show up?',
    a: 'Google publishes two separate timelines. For a newly verified business, Google states that rankings can take up to a month to appear. For an edit made to an existing profile, Google states that changes can take up to 3 days to appear. Checking your results the day after an edit will therefore not tell you whether the edit worked.',
  },
  {
    q: 'Google Business Profile not showing up in search — what do I check first?',
    a: 'Check verification status first, and then check how much time has passed since the profile was verified or last edited. Verification and timing are the only two conditions that make a profile genuinely invisible rather than merely low-ranked, and both can be confirmed in under a minute. Every remaining explanation concerns ranking and requires more work to diagnose.',
  },
  {
    q: 'Why does my Google Business Profile say duplicate?',
    a: 'Google has matched more than one profile to the same business, and Google’s policy treats multiple profiles as misleading to customers. If you created the extra profile yourself, you can remove that profile, which Google confirms can be done without affecting your verified listing. If both profiles are legitimate records of one business, report a suggestion on Google Maps to request a merge, keeping in mind Google’s note that all merge requests are subject to review.',
  },
  {
    q: 'Do I need a street address to show up on Google Maps?',
    a: 'A street address is not required. Google’s service-area business page covers companies that visit or deliver to customers without serving those customers at a business address, and Google’s instruction for such companies is to remove the address from the profile. That category includes most moving companies, pressure washing operations, and mobile auto detailing businesses.',
  },
  {
    q: 'Will adding more service areas make me show up in more cities?',
    a: 'Google caps service areas at twenty, states that the overall boundary should not exceed roughly two hours of driving time from your base, and instructs owners to be as specific and accurate as possible. Google’s service area page offers no guidance connecting the number of service areas to ranking performance. Filling all twenty slots with territory your crews rarely work makes your profile a less accurate description of where your company actually operates.',
  },
  {
    q: 'Do reviews affect whether I show up on Maps?',
    a: 'Reviews affect where your business ranks rather than whether your business appears at all. Google places reviews under prominence and states that more reviews and positive ratings can help your business’s local ranking. Google publishes neither a target review count nor a minimum rating, so any specific figure quoted elsewhere represents that author’s estimate.',
  },
]

const TOC = [
  { id: 'root-cause', label: 'Determine the Root Cause' },
  { id: 'incomplete', label: 'Your Profile Is Incomplete' },
  { id: 'ranked-below', label: "You're Listed, But Ranked Below the Pack" },
  { id: 'out-of-circulation', label: 'Your Profile Is Out of Circulation' },
  { id: 'faq', label: 'Common Questions' },
]

const GOOGLE_FIND_BUSINESS = 'https://support.google.com/business/answer/145585'
const GOOGLE_LOCAL_RANKING = 'https://support.google.com/business/answer/7091'
const GOOGLE_SERVICE_AREA = 'https://support.google.com/business/answer/9157481'
const GOOGLE_DUPLICATES = 'https://support.google.com/business/answer/12756178'
const GOOGLE_APPEALS = 'https://support.google.com/business/answer/4569145'
const GOOGLE_BUSINESS_HOME = 'https://business.google.com'

/** Every source here is Google's own documentation. The first page of search
 *  results for this query is entirely SEO vendors, none of which are citable
 *  under the source-vetting rule in the blog-writer skill. */
const SOURCES = [
  {
    href: GOOGLE_FIND_BUSINESS,
    label: 'Google Business Profile Help, "Find your business on Google"',
    detail:
      ' — verification requirement, the up-to-a-month window for new businesses, and the 3-day window for edits.',
  },
  {
    href: GOOGLE_LOCAL_RANKING,
    label: 'Google Business Profile Help, "Tips to improve your local ranking on Google"',
    detail: ' — relevance, distance, and prominence, and the complete-information items.',
  },
  {
    href: GOOGLE_SERVICE_AREA,
    label: 'Google Business Profile Help, service-area businesses',
    detail:
      ' — the remove-your-address rule, the twenty-area cap, and the two-hour driving boundary.',
  },
  {
    href: GOOGLE_DUPLICATES,
    label: 'Google Business Profile Help, "Resolve duplicate profiles & ownership issues"',
    detail: ' — duplicate policy, self-removal, and the merge-request process.',
  },
  {
    href: GOOGLE_APPEALS,
    label: 'Google Business Profile Help, suspended profiles and the appeals tool',
    detail: ' — supporting evidence accepted, and the rule against creating a second profile during an appeal.',
  },
]

export default function GbpNotShowingUp2026() {
  return (
    <>
      <p className="blog-lead">
        If your Google Business Profile isn&rsquo;t showing up on Maps, it&rsquo;s almost always one
        of two things: the profile is incomplete, so Google doesn&rsquo;t read it as a match for what
        people are typing, or the profile is complete and is simply ranked below the businesses in
        the local pack. This walks you through telling which one you have.
      </p>

      <p>
        Those two problems get blended together constantly, and the difference decides what you
        should go fix. Google&rsquo;s page on{' '}
        <a href={GOOGLE_FIND_BUSINESS} target="_blank" rel="noopener noreferrer">
          finding your business on Google
        </a>{' '}
        lists the reasons a profile fails to appear at all: it isn&rsquo;t verified, it&rsquo;s
        suspended or disabled, the business is brand new, or a recent edit hasn&rsquo;t processed
        yet. An incomplete profile is not on that list. Completeness lives on a different page
        entirely, the one on{' '}
        <a href={GOOGLE_LOCAL_RANKING} target="_blank" rel="noopener noreferrer">
          improving your local ranking
        </a>
        , where Google writes that &ldquo;businesses with complete and accurate info are more likely
        to show up in local search results.&rdquo;
      </p>

      <p>
        While it&rsquo;s important that your business profile is active, current, and has some data
        history, often times a profile that is complete and fully optimized will be the difference in
        out-ranking your competitors.
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

      <section className="blog-section" id="root-cause">
        <h2>Determine the Root Cause</h2>

        <p>
          Begin by confirming what Google displays to a stranger, because the profile a stranger sees
          differs from the profile you see as the owner.
        </p>
        <p>
          Google&rsquo;s own instruction is to search your business name together with your city on
          Google Search, and then to run that identical search on Google Maps. On a phone, you can
          open the Maps app and tap &ldquo;Business&rdquo; at the bottom right. Each of these three
          checks is worth running, because a profile can behave differently across them.
        </p>
        <p>
          Google&rsquo;s documentation omits one detail that will save you considerable time. When
          you are signed into the account that owns the profile, the results Google returns are
          personalized to you as the owner, which means those results overstate how visible your
          business appears to everyone else. Open a private browsing window, sign out of your Google
          account, and run the same three searches again. The signed-out results are the accurate
          measure of what a prospective customer encounters.
        </p>

        <h3>Rule out timing first</h3>
        <p>
          For a meaningful share of business owners, the answer is simply that not enough time has
          passed. Google states that &ldquo;rankings for new businesses can take up to a month to
          appear in search results,&rdquo; so a fence installation company that completed
          verification nine days ago may have nothing wrong with the profile at all. Google
          separately states that when you edit an existing profile, &ldquo;changes can take up to 3
          days to appear.&rdquo; A category corrected on Tuesday and checked on Wednesday has not yet
          had time to propagate through Google&rsquo;s systems.
        </p>

        <h3>Then take the fork</h3>
        <p>
          <strong>Nothing appears at all</strong> when you search your exact business name plus your
          city, signed out, across both Search and Maps. In that situation your profile has been
          taken out of circulation for a reason unrelated to the quality of the profile itself, and{' '}
          <a href="#out-of-circulation">the final section</a> covers the three causes.
        </p>
        <p>
          <strong>Your business appears when you search its name</strong>, but never appears when you
          search the work you perform, such as &ldquo;garage door repair near me&rdquo; or
          &ldquo;pest control&rdquo; combined with your city. A profile in this condition is already
          live, so the problem lies in how Google ranks the profile rather than in whether Google
          displays the profile at all. The next two sections address that situation. The distinction
          carries real commercial weight, because a customer searching for your business by name
          already knows your company, while a customer searching for the work itself represents
          revenue you have not won yet.
        </p>
      </section>

      <section className="blog-section" id="incomplete">
        <h2>Your Profile Is Incomplete</h2>

        <p>
          An incomplete profile accounts for the largest share of these problems, and completeness is
          the only cause on this list that a business owner can resolve independently and
          immediately.
        </p>
        <p>
          To edit any of it, sign in with the Google account that owns the profile and manage it from{' '}
          <a href={GOOGLE_BUSINESS_HOME} target="_blank" rel="noopener noreferrer">
            business.google.com
          </a>
          , or from the editing controls Google surfaces when you search your own business name while
          signed in.
        </p>

        <h3>Categories</h3>
        <p>
          Your category tells Google what kind of business you operate, and Google lists your
          category among the complete-information items on its local ranking page. Select the
          category that describes the actual work rather than a broader label, because a garage door
          company filed under a generic &ldquo;repair service&rdquo; category forces Google to infer
          the specialty. Secondary categories exist to capture the additional work your company
          genuinely performs, so a roofing company that also installs gutters should record both.
          Adding categories for work your company does not perform undermines the accuracy that
          Google explicitly requires alongside completeness.
        </p>

        <h3>Services and the description</h3>
        <p>
          This section is easily and commonly overlooked during setup. Google stresses the importance
          of relevance in this section, defining relevance as &ldquo;how well a local Business
          Profile matches what someone is searching for.&rdquo; A services list left empty gives
          Google very little of your actual work to match against an incoming search. Populate the
          list with the individual jobs you would write on an invoice, using the words your customers
          use when they describe those jobs. The description deserves the same treatment, written in
          plain language covering what your company does and the areas where your company does it.
        </p>

        <h3>Address and service area</h3>
        <p>
          Address configuration is the single most common setup error among trades. Google&rsquo;s
          page on{' '}
          <a href={GOOGLE_SERVICE_AREA} target="_blank" rel="noopener noreferrer">
            service-area businesses
          </a>{' '}
          defines one as a business that &ldquo;visits or delivers to customers directly but
          doesn&rsquo;t serve customers at their business address,&rdquo; and its instruction is
          direct: &ldquo;If you don&rsquo;t serve customers at your business address, remove your
          address from your Business Profile.&rdquo; A mobile auto detailing operation run out of a
          garage, a painting company working out of a truck, and a landscaping crew that meets nobody
          at the shop are all service-area businesses, and leaving a home address published is the
          wrong setup for each of them.
        </p>
        <p>
          Google&rsquo;s service area rules are unusually specific. Google allows &ldquo;up to 20
          service areas based on the cities, postal codes, or other areas you serve,&rdquo; and
          states that &ldquo;the boundaries of your overall area shouldn&rsquo;t be more than about 2
          hours of driving time from where your business is based.&rdquo; Google further instructs
          owners to &ldquo;be as specific and accurate as possible.&rdquo; The limit of twenty areas
          functions as a ceiling rather than a target. An owner who lists every town within a
          two-hour radius on the reasoning that the crew would technically travel there describes the
          business less accurately than an owner who lists the eight towns the crew actually
          services, and accuracy is the quality Google asks for.
        </p>

        <h3>Hours</h3>
        <p>
          Google names &ldquo;business hours, including special hours&rdquo; among its
          complete-information items. Most owners populate their regular weekly hours during setup
          and then never revisit the field. Special hours, which cover holidays and any period such
          as the week between Christmas and New Year when your crews are not working, are the portion
          that typically remains empty.
        </p>

        <h3>Photos</h3>
        <p>
          Google does not name photographs among its complete-information items, so the following
          point rests on customer behavior rather than on Google documentation. The local results
          panel typically presents three businesses at once, and a customer chooses among those three
          partly on the visual evidence each profile provides. A profile carrying two photographs
          from 2019 competes directly against a flooring company that has posted fifty recent ones.{' '}
          <Link href="/features/before-after">Before-and-after photographs from completed jobs</Link>{' '}
          are the most practical way to keep that library current, because your crews generate the
          material during work they are already performing.
        </p>

        <h3>Contact fields and attributes</h3>
        <p>
          Your phone number and website address belong here, alongside the attributes Google
          describes as details &ldquo;like parking or Wi-Fi.&rdquo; Attributes carry less weight for
          an HVAC company than for a restaurant, though every populated field still contributes to
          the completeness Google measures.
        </p>
      </section>

      <section className="blog-section" id="ranked-below">
        <h2>You&rsquo;re Listed, But Ranked Below the Pack</h2>

        <p>
          When your profile is verified, complete, and accurate and your business still fails to
          appear for the searches that generate work, the remaining problem is competitive ranking.
          Google publishes the criteria it applies.
        </p>
        <p>
          One inconsistency on Google&rsquo;s page deserves mention, because most published guidance
          on this topic resolves it silently. The summary line at the top of{' '}
          <a href={GOOGLE_LOCAL_RANKING} target="_blank" rel="noopener noreferrer">
            Google&rsquo;s local ranking page
          </a>{' '}
          names the three factors as &ldquo;relevance, distance, and popularity,&rdquo; while the
          detailed heading further down the same page uses the term &ldquo;Prominence&rdquo; for that
          third factor. Google therefore uses two different words for one factor within a single
          document. Where other sources select one term and present the choice as settled, the honest
          position is that Google has not settled the question itself.
        </p>

        <h3>Relevance</h3>
        <p>
          Google defines relevance as &ldquo;how well a local Business Profile matches what someone
          is searching for,&rdquo; and Google attaches to relevance the statement that
          &ldquo;businesses with complete and accurate info are more likely to show up in local
          search results.&rdquo; Every field discussed in the previous section contributes to
          relevance, which makes relevance the factor most directly within your control.
        </p>

        <h3>Distance</h3>
        <p>
          Distance measures how far your business sits from the person running the search. When a
          searcher does not share a location, Google relies on whatever location information Google
          already holds for that person. Distance is the one factor of the three that no business
          owner can influence, because your business address and the searcher&rsquo;s position are
          both fixed at the moment the search happens. A plumbing company located twenty minutes
          outside a city will rank lower on searches run from downtown than an otherwise identical
          plumbing company located downtown, and no setting inside a Business Profile changes that
          result. The practical consequence for you is that effort spent trying to overcome distance
          returns nothing, while the same effort applied to relevance and prominence produces
          movement you can measure.
        </p>

        <h3>Prominence</h3>
        <p>
          Google defines prominence as &ldquo;how well-known a business is,&rdquo; and attributes
          prominence partly to how many other websites link to the business and partly to reviews,
          stating that &ldquo;more reviews and positive ratings can help your business&rsquo;s local
          ranking.&rdquo; Google identifies review volume and review rating as the relevant inputs
          without publishing any threshold a business must clear or any timeline over which reviews
          take effect, so any specific number quoted elsewhere should be treated as that
          author&rsquo;s estimate rather than as Google guidance. For most trades, inbound links are
          the weaker half of prominence, because a pest control company rarely publishes material
          that another website has reason to link to.
        </p>

        <h3>All three decay on their own</h3>
        <p>
          Business hours change over time, the services a company offers change, and the eight towns
          a crew worked last year are rarely the same eight towns the crew works today. A profile
          built two years ago therefore describes a business that no longer exists in several small
          and specific respects, and that accumulated drift erodes accuracy even though nobody has
          edited the profile.{' '}
          <Link href="/features/review-requests">Review volume stops growing</Link> during any period
          when a company stops asking customers for reviews. Inbound links stop accumulating as well,
          because a company that publishes nothing new gives other websites nothing new to reference.
        </p>
        <p>
          Google&rsquo;s ranking page makes no claim that posting frequency is a ranking factor, so
          any source presenting posting frequency as one is offering an opinion rather than citing
          Google. The three inputs Google does name are complete and accurate information, review
          volume and rating, and links from other websites, and all three of those inputs stall as
          soon as a profile stops being maintained.
        </p>
        <p>
          ProjectCheckin was built to address that maintenance problem directly. A crew checks in
          from the job site with photographs and a small number of details, that check-in becomes a{' '}
          <Link href="/features/local-job-pages">page describing the work on your own website</Link>,
          and the same job{' '}
          <Link href="/features/gbp-post-generator">publishes to your Google Business Profile</Link>.
          The result is a profile that describes the work your company is performing currently rather
          than the business your company ran two years ago.
        </p>
        <p>
          Getting these three factors right earns your business a place in front of a searcher. It
          does not by itself guarantee a click — see{' '}
          <Link href="/blog/ai-overviews-what-the-data-shows">
            why AI Overviews are cutting clicks even for well-ranked pages
          </Link>{' '}
          for what the data actually shows about that gap.
        </p>
      </section>

      <section className="blog-section" id="out-of-circulation">
        <h2>Your Profile Is Out of Circulation</h2>

        <p>
          The three causes in this section are the least common of the explanations covered here,
          though owners frequently assume one of them first. This section applies only when nothing
          appears at all for your exact business name combined with your city.
        </p>

        <h3>Unverified</h3>
        <p>
          Google states the requirement directly: &ldquo;only verified businesses can show their
          business info on Maps and Search.&rdquo; Creating a profile and verifying a profile are
          separate steps, and a profile that has been created but not verified will not appear
          publicly.
        </p>

        <h3>Suspended or disabled</h3>
        <p>
          Google&rsquo;s wording is that &ldquo;if your Business Profile violates our guidelines, it
          becomes disabled or suspended and won&rsquo;t show to other users on Google until you
          resolve the issue.&rdquo; The route back is Google&rsquo;s{' '}
          <a href={GOOGLE_APPEALS} target="_blank" rel="noopener noreferrer">
            Business Profile appeals tool
          </a>
          , where you submit supporting evidence such as business registration documents, a license,
          a tax certificate, or a utility bill. Google&rsquo;s instruction while you wait is specific
          and worth following: do not create a new Business Profile for the same business while your
          appeal is under review.
        </p>

        <h3>Duplicates</h3>
        <p>
          Google says &ldquo;multiple profiles for the same business may mislead your customers and
          are against our policies.&rdquo; Per its{' '}
          <a href={GOOGLE_DUPLICATES} target="_blank" rel="noopener noreferrer">
            duplicate profiles page
          </a>
          , a duplicate you created yourself can be removed &ldquo;without affecting your verified
          listing.&rdquo; If two profiles exist for one legitimate business, you report a suggestion
          on Google Maps to request a merge, and Google notes that &ldquo;all merge requests are
          subject to review.&rdquo; If the business relocated, update the existing profile&rsquo;s
          address instead of creating a second one.
        </p>
      </section>

      <section className="blog-faq" id="faq">
        <h2>Common Questions</h2>
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
        <h2>Keep Your Profile Describing the Work You Are Doing Now</h2>
        <p>
          ProjectCheckin turns finished jobs into pages on your own website and posts on your Google
          Business Profile, starting from a check-in your crew completes on their phone.
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
