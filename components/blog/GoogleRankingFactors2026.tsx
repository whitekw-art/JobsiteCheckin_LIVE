import Image from 'next/image'
import Link from 'next/link'
import BlogCta from '@/components/blog/BlogCta'

const IMG_BASE = '/blog/google-ranking-factors-2026'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: 'How long does it take to see ranking improvements after fixing these factors?',
    a: 'Local ranking signals move fastest — profile completeness and review activity can show up in Google’s own reporting within weeks. Broader organic ranking, the kind tied to your actual website, moves on a longer timeline, and Google doesn’t publish a fixed number for that. Local moves first, organic follows.',
  },
  {
    q: 'Do I need to hire an SEO agency to do this myself?',
    a: 'No. Every fix in this article is something you can do yourself inside free Google tools like Google Business Profile and Search Console. None of the 11 factors require a developer or an agency retainer — you need time and a checklist, not a vendor contract.',
  },
  {
    q: 'Which of these 11 factors matters most if I can only do one thing this week?',
    a: 'Google Business Profile completeness and review responsiveness are the two highest-leverage moves you can make. Both are Critical-tier factors, and neither requires touching your website code. Fill out your profile completely and respond to every review within a day or two, and you’ve covered both in one sitting.',
  },
  {
    q: 'Does posting more often on my website help my Google ranking?',
    a: 'Not by itself — how often you publish isn’t a confirmed Google ranking factor. What matters is freshness and substance: real, useful content beats a higher volume of thin posts. The actual leverage for a business owner is in the 11 factors covered above, not in publishing cadence.',
  },
]

const TOC = [
  'Google Business Profile Completeness',
  'Review Recency and Response Rate',
  'NAP Consistency',
  'Proximity, Relevance, and Prominence',
  'Mobile-Friendliness',
  'Core Web Vitals',
  'HTTPS',
  'Structured Data',
  'Content Quality (E-E-A-T)',
  'Local Backlinks and Citations',
  'Showing Up in AI Search',
]

export default function GoogleRankingFactors2026() {
  return (
    <>
      <p className="blog-lead">
        A local service business&apos;s Google ranking in 2026 comes down to a short, specific
        list: a fully completed Google Business Profile, recent and answered customer reviews, a
        fast and secure mobile-friendly website, real proof of finished work, structured data
        Google can read, local backlinks, and content built so AI search tools can pull direct
        answers from it. Nothing about keyword stuffing or paid tricks moves the needle anymore.
      </p>

      <p>
        Most business websites don&apos;t rank because of a handful of fixable problems: an
        incomplete Google Business Profile, no schema markup, reviews that haven&apos;t been
        touched in months, a site that&apos;s slow or hard to use on a phone. The 11 factors below
        are drawn from Google&apos;s own guidelines and confirmed 2026 changes — what each one
        means, how much it carries, and one thing to do about it this week.
      </p>

      <nav className="blog-toc" aria-label="Table of contents">
        <h2>In This Article</h2>
        <ol>
          {TOC.map((label, i) => (
            <li key={label}>
              <a href={`#f${i + 1}`}>
                {i + 1}. {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 01 ── */}
      <section className="blog-factor" id="f1">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">01</div>
          <div className="blog-factor-titlewrap">
            <h2>Google Business Profile Completeness</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            Your Google Business Profile is the box that shows up on Google Maps and in local
            search results with your hours, phone number, photos, and reviews.
            &ldquo;Completeness&rdquo; just means how much of that box you&apos;ve actually filled
            in. Every job ProjectCheckin publishes can also generate a{' '}
            <Link href="/features/gbp-post-generator">ready-to-post Google Business update</Link>{' '}
            automatically, which is a separate, smaller completeness signal on top of the one-time
            setup below.
          </p>
          <h3>Impact</h3>
          <p>
            Google has said directly, for years, that complete profiles perform better in Search
            and Maps. SEO trackers watching ranking activity in early 2026 found completeness
            mattering more than ever — incomplete profiles losing ground, not just missing out on
            extra visibility.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Go to{' '}
            <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
              business.google.com
            </a>{' '}
            and sign into your profile.
          </p>
          <figure className="blog-shot">
            <Image
              src={`${IMG_BASE}/gbp-edit-profile.png`}
              alt="Google Business Profile dashboard with the Edit profile button highlighted"
              width={906}
              height={309}
            />
            <figcaption>Your main dashboard — every step below starts here.</figcaption>
          </figure>
          <p>Three things to fill in, in order:</p>
          <ol>
            <li>
              Click <strong>Edit profile</strong>, then the <strong>About</strong> tab. Confirm
              your primary category is the closest match to what you actually do, then click Add
              another category to add up to nine more that fit.
            </li>
          </ol>
          <figure className="blog-shot">
            <Image
              src={`${IMG_BASE}/gbp-category.png`}
              alt="Google Business Profile category screen showing primary and additional category fields"
              width={948}
              height={733}
            />
            <figcaption>
              Primary category, additional categories, and Add another category — all on the About
              tab.
            </figcaption>
          </figure>
          <ol start={2}>
            <li>
              Click the <strong>Hours</strong> tab and add your regular hours, then scroll down to
              Special hours to add anything for holidays.
            </li>
          </ol>
          <figure className="blog-shot">
            <Image
              src={`${IMG_BASE}/gbp-hours.png`}
              alt="Google Business Profile hours screen showing regular hours and the special hours section"
              width={939}
              height={721}
            />
            <figcaption>Regular hours plus Special hours — both live on the Hours tab.</figcaption>
          </figure>
          <ol start={3}>
            <li>
              Back out to the main dashboard and click <strong>Edit services</strong> (a separate
              button, not inside Edit profile) to list every service you offer with a short
              description for each one.
            </li>
          </ol>
          <p>
            While you&apos;re in Edit profile, the <strong>More</strong> tab also has a Service
            options section — accessibility, language assistance, appointment booking. It&apos;s a
            smaller completeness signal, but it takes two minutes and most competitors skip it
            entirely.
          </p>
          <figure className="blog-shot">
            <Image
              src={`${IMG_BASE}/gbp-service-options.png`}
              alt="Google Business Profile Service options screen under the More tab showing accessibility and language attributes"
              width={951}
              height={726}
            />
            <figcaption>
              Service options on the More tab — accessibility and language attributes.
            </figcaption>
          </figure>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 02 ── */}
      <section className="blog-factor" id="f2">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">02</div>
          <div className="blog-factor-titlewrap">
            <h2>Review Recency and Response Rate</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            How recently you&apos;ve gotten reviews, and how often you actually reply to them, both
            factor into your ranking now — separate from your total review count. A one-tap{' '}
            <Link href="/features/review-requests">review request sent right after a job</Link> is
            the easiest way to keep this signal fresh instead of relying on customers to think of
            it themselves.
          </p>
          <h3>Impact</h3>
          <p>
            Review recency and engagement carry more weight than raw count. SEO trackers watching
            ranking activity in early 2026 found businesses with a steady flow of recent reviews
            consistently outranking ones sitting on a large but stale review count. Responding
            within 24-48 hours, to both good and bad reviews, is part of that signal.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Go to{' '}
            <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
              business.google.com
            </a>{' '}
            and click Reviews in the left menu. Start replying to every review that doesn&apos;t
            have a response yet, oldest first. Name the actual service in your reply, and the
            customer&apos;s first name if you can — a real, specific two-sentence reply beats a
            generic thank you every time.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 03 ── */}
      <section className="blog-factor" id="f3">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">03</div>
          <div className="blog-factor-titlewrap">
            <h2>NAP Consistency (Name, Address, Phone)</h2>
            <span className="blog-impact blog-impact-high">High</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            Your business name, address, and phone number need to match, exactly, everywhere they
            appear online — Google, your website, Yelp, BBB, Facebook, and any directory
            you&apos;re listed on. &ldquo;Suite 100&rdquo; on one site and &ldquo;#100&rdquo; on
            another counts as a mismatch.
          </p>
          <h3>Impact</h3>
          <p>
            Every mismatch is a small dose of doubt Google can&apos;t fully resolve about whether
            these are really the same business. Enough of them and your profile loses trust.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Open an incognito window and search your business name and city. Open every result on
            the first page — your website, Yelp, Facebook, BBB, any directory that comes up — and
            write down the address and phone number listed on each one. Anywhere that doesn&apos;t
            match your Google Business Profile exactly, whether it&apos;s an old phone number, an
            abbreviation, or a suite number formatted differently, go fix it.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 04 ── */}
      <section className="blog-factor" id="f4">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">04</div>
          <div className="blog-factor-titlewrap">
            <h2>Proximity, Relevance, and Prominence</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            These are the factors Google has stated, directly, decide who shows up in the local map
            pack. Proximity is how close you are to the person searching. Relevance is how well
            your profile matches what they typed in. Prominence — what{' '}
            <a
              href="https://support.google.com/business/answer/7091"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;s own Business Profile help center
            </a>{' '}
            currently calls &ldquo;popularity&rdquo; — is how well-known and trusted your business
            is online.
          </p>
          <h3>Impact</h3>
          <p>
            You can&apos;t do much about proximity — that&apos;s just geography. But relevance and
            prominence are both things you control, through your category choice, your service
            list, and the reviews and mentions you build over time.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            In Google Business Profile Manager, go to Edit profile, Business information, Category,
            and check that your primary category is as specific as it can be — &ldquo;Garage Door
            Supplier&rdquo; beats &ldquo;Contractor&rdquo; every time. Then go to your Services
            section and rewrite anything vague using the words a customer would actually search,
            like &ldquo;garage door spring repair&rdquo; instead of &ldquo;repair services.&rdquo;
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 05 ── */}
      <section className="blog-factor" id="f5">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">05</div>
          <div className="blog-factor-titlewrap">
            <h2>Mobile-Friendliness</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            Google looks at how your website works on a phone before it looks at how it works on a
            desktop computer, when deciding where to rank you. A lot of business sites were built
            years ago for desktop and never checked on mobile since.
          </p>
          <h3>Impact</h3>
          <p>
            Critical — confirmed Google policy since{' '}
            <a
              href="https://developers.google.com/search/blog/2020/03/mobile-first-indexing-2020"
              target="_blank"
              rel="noopener noreferrer"
            >
              mobile-first indexing
            </a>{' '}
            was enforced.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Pull up your website on your phone, in Safari or Chrome, and go through every page a
            customer would actually look at: home, services, contact. Write down anything
            that&apos;s cut off, too small to read, too small to tap, or slow to load. Send that
            list to whoever manages your site and get it fixed.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 06 ── */}
      <section className="blog-factor" id="f6">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">06</div>
          <div className="blog-factor-titlewrap">
            <h2>Core Web Vitals (Page Speed and Stability)</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            This measures two things — how fast your page loads, and whether the page jumps around
            while it&apos;s loading (like a button moving right as you&apos;re about to tap it).
            Google has confirmed directly, since 2021, that both affect ranking.
          </p>
          <h3>Impact</h3>
          <p>
            Critical — a documented part of Google&apos;s{' '}
            <a href="https://web.dev/articles/vitals" target="_blank" rel="noopener noreferrer">
              Core Web Vitals
            </a>{' '}
            ranking signal.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Go to{' '}
            <a href="https://pagespeed.web.dev" target="_blank" rel="noopener noreferrer">
              pagespeed.web.dev
            </a>
            , paste in your homepage, and hit Analyze. Check the Mobile tab first, since that&apos;s
            what Google actually uses to rank you. Anything scored red or orange is a real problem —
            send the report to your developer or hosting provider and have them fix the red ones
            first.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 07 ── */}
      <section className="blog-factor" id="f7">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">07</div>
          <div className="blog-factor-titlewrap">
            <h2>HTTPS (Secure Connection)</h2>
            <span className="blog-impact blog-impact-critical">Critical</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            That&apos;s the little padlock icon next to your web address. It means the connection to
            your site is encrypted. Sites without it get labeled &ldquo;Not Secure&rdquo; in the
            browser and Google ranks them lower for it.
          </p>
          <h3>Impact</h3>
          <p>
            Critical, and table stakes since Google{' '}
            <a
              href="https://developers.google.com/search/blog/2014/08/https-as-ranking-signal"
              target="_blank"
              rel="noopener noreferrer"
            >
              confirmed HTTPS as a ranking signal in 2014
            </a>{' '}
            — this isn&apos;t new, but plenty of older business sites still don&apos;t have it.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Look at your website address in the browser bar. If it says http:// without the
            &ldquo;s,&rdquo; or your browser shows &ldquo;Not Secure,&rdquo; call your hosting
            company and ask them to install a free SSL certificate. Most hosts — GoDaddy, Bluehost,
            Squarespace, Wix — can turn it on in one click from your account dashboard.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 08 ── */}
      <section className="blog-factor" id="f8">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">08</div>
          <div className="blog-factor-titlewrap">
            <h2>Structured Data (Schema Markup)</h2>
            <span className="blog-impact blog-impact-high">High</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            This is invisible code added to your website that tells Google exactly what your page is
            about — your business type, your service area, your reviews — instead of making Google
            guess by reading through your text. Most small business sites have none of it.
          </p>
          <h3>Impact</h3>
          <p>
            High — documented directly in{' '}
            <a
              href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;s structured data guidance
            </a>{' '}
            as enabling rich results and clearer entity understanding. ProjectCheckin&apos;s own job
            pages already carry LocalBusiness and Service schema (see our{' '}
            <Link href="/features/local-job-pages">Local Job Pages feature</Link>) — most
            independent business websites don&apos;t.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Go to{' '}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
            >
              search.google.com/test/rich-results
            </a>
            , paste in your homepage, and click Test URL. If it comes back saying no structured data
            was found, or &ldquo;LocalBusiness&rdquo; doesn&apos;t show up anywhere in the results,
            send that to your developer and ask them to add LocalBusiness schema to your site.
          </p>
          <figure className="blog-shot">
            <Image
              src={`${IMG_BASE}/rich-results-test.jpg`}
              alt="Google Rich Results Test showing two valid structured data items detected"
              width={1442}
              height={615}
            />
            <figcaption>
              This is what a pass looks like — &ldquo;valid items detected.&rdquo; Most independent
              business sites come back with zero.
            </figcaption>
          </figure>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 09 ── */}
      <section className="blog-factor" id="f9">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">09</div>
          <div className="blog-factor-titlewrap">
            <h2>Content Quality (E-E-A-T)</h2>
            <span className="blog-impact blog-impact-high">High</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            Google calls this{' '}
            <a
              href="https://developers.google.com/search/blog/2022/12/google-raters-guidelines-e-e-a-t"
              target="_blank"
              rel="noopener noreferrer"
            >
              E-E-A-T
            </a>
            , and it&apos;s laid out in their own public Quality Rater Guidelines. In plain terms,
            Google wants proof that your business actually does the work it claims to do. Real
            photos of real jobs carry that proof; a vague claim about being &ldquo;the best in the
            area&rdquo; does not — a real{' '}
            <Link href="/features/before-after">before-and-after comparison</Link> makes that proof
            even harder to dismiss.
          </p>
          <h3>Impact</h3>
          <p>
            High — part of Google&apos;s published Quality Rater Guidelines since the 2022 update
            that added &ldquo;Experience&rdquo; to the framework.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Pick your three most recent finished jobs. Upload the photos to your Google Business
            Profile under Photos, and to your website&apos;s project or gallery page if you have
            one. Write a couple of real sentences under each one: what the job was, where it was,
            what you did. Skip the stock photos.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 10 ── */}
      <section className="blog-factor" id="f10">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">10</div>
          <div className="blog-factor-titlewrap">
            <h2>Local Backlinks and Citations</h2>
            <span className="blog-impact blog-impact-critical">Critical / High</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            A backlink is another website linking to yours — Google reads that as a vote of
            confidence, and links from local sites (your chamber of commerce, local news, local
            directories) count for more than generic ones from nowhere in particular. A citation is
            simpler — it&apos;s just your business info listed correctly on a directory site.
          </p>
          <h3>Impact</h3>
          <p>
            Critical for backlinks, High for citations — Google&apos;s founding algorithm has always
            weighted links heavily, and a Google Search Quality strategist confirmed &ldquo;links
            and content&rdquo; as the top two ranking factors in a 2016 public Q&amp;A.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>Three directories to get listed on this week:</p>
          <ol>
            <li>
              Search your city plus &ldquo;chamber of commerce business directory&rdquo; and get
              listed if you&apos;re a member.
            </li>
            <li>
              Search your city plus &ldquo;business directory&rdquo; for a local news or community
              site and submit there too.
            </li>
            <li>Find at least one directory specific to your trade and get on it.</li>
          </ol>
          <p>
            Keep your name, address, and phone number identical to your Google profile on every
            single one.
          </p>
        </div>
      </section>
      <hr className="blog-divider" />

      {/* ── 11 ── */}
      <section className="blog-factor" id="f11">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">11</div>
          <div className="blog-factor-titlewrap">
            <h2>Showing Up in AI Search (FAQ Content)</h2>
            <span className="blog-impact blog-impact-high">High &amp; Growing</span>
          </div>
        </div>
        <div className="blog-factor-body">
          <p>
            More people are asking ChatGPT, Perplexity, and Google&apos;s AI Overviews questions
            instead of typing search terms into a search bar. These AI tools pull their answers from
            pages that state a question and answer it directly, in plain sentences, right up front.
          </p>
          <h3>Impact</h3>
          <p>
            High and growing through 2026 —{' '}
            <a
              href="https://developers.google.com/search/docs/appearance/structured-data/faqpage"
              target="_blank"
              rel="noopener noreferrer"
            >
              FAQ schema
            </a>{' '}
            is directly confirmed by Google&apos;s rich-results documentation, and AI systems
            consistently favor pages with a clear, extractable answer.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Think about the three to five questions people actually ask before they hire you —
            price, timeline, warranty, service area. Add an FAQ section to your homepage, or its own
            page, with each question as a heading and a direct one-to-three sentence answer
            underneath. If your website platform has a built-in FAQ block — WordPress, Squarespace,
            and Wix all do — use it.
          </p>
        </div>
      </section>

      <div className="blog-closing">
        <h2>Where This Leaves You</h2>
        <p>
          None of these eleven factors move your ranking by themselves overnight, and anyone who
          tells you otherwise is selling something. They build on each other over weeks and months
          of consistent effort — a complete profile, real reviews answered promptly, a site that
          loads fast and works on a phone, and real proof of work published consistently.
        </p>
        <p>
          That last part is where ProjectCheckin fits in. Every time your crew checks in on a job,
          it automatically applies schema markup, publishes to a fast mobile-first page, serves over
          HTTPS, and adds fresh, location-specific content with structured FAQ formatting AI search
          tools can read — all as a byproduct of documenting the job the way you&apos;d want it
          documented anyway. It doesn&apos;t touch your review responses, your backlinks, or your
          NAP consistency across directories — those still take your own hands. But four of the
          eleven factors above happen automatically, every time a job gets checked in.
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

      <BlogCta source="blog/google-ranking-factors-2026" />
    </>
  )
}
