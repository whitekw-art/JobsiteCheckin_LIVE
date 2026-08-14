import Link from 'next/link'
import BlogCta from '@/components/blog/BlogCta'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: 'Is the drop in website traffic from AI search actually real?',
    a: 'Yes. The Reuters Institute at Oxford reported that Google organic search traffic to more than 2,500 news sites fell by roughly a third globally, and by 38% in the United States, between November 2024 and November 2025. Pew Research Center found people click a traditional result 8% of the time when an AI summary is present, compared with 15% when there isn’t one.',
  },
  {
    q: 'Should I be worried about ChatGPT taking my customers?',
    a: 'Probably not as your first concern. The Reuters Institute at Oxford found that ChatGPT referrals are rising fast but remain little more than a rounding error, with Google sending roughly 500 times as many referrals from search alone. The change affecting your traffic is happening inside Google’s results page.',
  },
  {
    q: 'If my business gets cited in an AI Overview, does that send me traffic?',
    a: 'Rarely on its own. Pew Research Center found that only 1% of visits included a click on a link inside the AI summary, and 88% of those summaries cited three or more sources. Being named is good for visibility and credibility, and it is not a traffic plan by itself.',
  },
  {
    q: 'Do I have to rank on page one to be cited in an AI Overview?',
    a: 'Apparently not. Researchers at Washington University in St. Louis found that nearly 30% of the domains cited in AI Overviews did not appear anywhere on the first page of ordinary results for that same search. Their paper is a preprint under review, so treat it as strong early evidence rather than a settled conclusion.',
  },
  {
    q: 'Is there special optimization I need to do for AI search?',
    a: 'No. Google’s own documentation states that there are no additional requirements to appear in AI Overviews or AI Mode, and no special optimizations necessary, including no special schema and no new files to create. Google’s Search Liaison summed it up as “good SEO is good GEO.”',
  },
]

const TOC = [
  { id: 's1', label: 'What the Data Actually Shows' },
  { id: 's2', label: 'It’s Google, Not ChatGPT' },
  { id: 's3', label: 'Getting Cited Isn’t the Whole Answer' },
  { id: 's4', label: 'You Don’t Have to Outrank Everyone to Get Cited' },
  { id: 's5', label: 'Google Says There’s No Special Trick' },
  { id: 'f1', label: '1. Specific, Checkable Facts' },
  { id: 'f2', label: '2. Consistent, Accurate Business Information' },
]

const PEW_2026 =
  'https://www.pewresearch.org/internet/2026/06/17/americans-and-ai-2026-chatbots-smart-devices-and-views-on-impact/'
const PEW_2025 =
  'https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/'
const REUTERS =
  'https://reutersinstitute.politics.ox.ac.uk/journalism-media-and-technology-trends-and-predictions-2026'
const WASHU = 'https://arxiv.org/abs/2605.14021'
const GEO_PAPER = 'https://arxiv.org/abs/2311.09735'
const GOOGLE_AI_DOCS = 'https://developers.google.com/search/docs/appearance/ai-features'
const GBP_GUIDELINES = 'https://support.google.com/business/answer/3038177'
const WORDCAMP = 'https://us.wordcamp.org/2025/session/keynote/'

/** Every source here is non-commercial or primary: nonprofit research, academic
 *  preprints, and Google's own documentation. No SEO vendor is cited or linked. */
const SOURCES = [
  {
    href: PEW_2026,
    label: 'Pew Research Center, “Americans and AI 2026: Chatbots, Smart Devices and Views on Impact”',
    detail: ' (June 17, 2026). Survey of 5,119 U.S. adults, February 17–23, 2026.',
  },
  {
    href: PEW_2025,
    label: 'Pew Research Center, “Do people click on links in Google AI summaries?”',
    detail: ' (July 2025). Browsing data from 900 U.S. adults, 68,879 searches, March 2025.',
  },
  {
    href: WASHU,
    label:
      'Xu, Iqbal & Montgomery, Washington University in St. Louis, “Measuring Google AI Overviews: Activation, Source Quality, Claim Fidelity, and Publisher Impact”',
    detail: ' (2026). 55,393 trending searches, March 13 – April 21, 2026. Preprint under review.',
  },
  {
    href: REUTERS,
    label:
      'Reuters Institute for the Study of Journalism, University of Oxford, Journalism, Media and Technology Trends and Predictions 2026',
    detail: '. Traffic data supplied by Chartbeat.',
  },
  {
    href: GEO_PAPER,
    label: 'Aggarwal et al., “GEO: Generative Engine Optimization”',
    detail: ' (Princeton and Georgia Tech), ACM SIGKDD.',
  },
  {
    href: GOOGLE_AI_DOCS,
    label: 'Google Search Central, AI Features and Your Website',
    detail: '.',
  },
  {
    href: GBP_GUIDELINES,
    label: 'Google Business Profile Help, Guidelines for representing your business on Google',
    detail: '.',
  },
  {
    href: WORDCAMP,
    label: 'Danny Sullivan, “How (and why!) Google Search keeps evolving”',
    detail: ', WordCamp US keynote, August 2025.',
  },
]

export default function AiOverviews2026() {
  return (
    <>
      <p className="blog-lead">
        Yes, the drop is real, and it is coming from Google’s AI Overviews rather than from ChatGPT.
        Pew Research Center found people click a search result far less often when an AI summary sits
        at the top of the page. Google says there is no separate AI playbook to learn. The
        fundamentals that earned ordinary search visibility still apply.
      </p>

      <p>
        If you install doors, run a fence crew, or do pest control, most of your search traffic comes
        from people looking for a specific service in a specific place. That’s a narrower situation
        than a national news publisher’s, and the research below was measured on the open web and on
        news sites rather than on local service businesses. It still matters to you, because it shows
        where Google is sending attention now and what kind of page it pulls answers from.
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
        <h2>What the Data Actually Shows</h2>
        <p>
          Start with how common this is now. In a survey of 5,119 U.S. adults conducted in February
          2026,{' '}
          <a href={PEW_2026} target="_blank" rel="noopener noreferrer">
            Pew Research Center
          </a>{' '}
          found that 60% of Americans read the AI-generated summaries at the top of search results.
          This is no longer a fringe behavior that only shows up among early adopters.
        </p>
        <p>
          What that does to clicks was measured separately.{' '}
          <a href={PEW_2025} target="_blank" rel="noopener noreferrer">
            Pew tracked 68,879 Google searches
          </a>{' '}
          from 900 U.S. adults who agreed to install a browsing tracker. When an AI summary appeared
          at the top of the results, people clicked a traditional search result 8% of the time. When
          there was no AI summary, they clicked 15% of the time. Pew also found that 26% of page
          visits ended the person’s browsing session entirely when an AI summary appeared, compared
          with 16% when one didn’t. In plain terms, more people are getting what they came for on the
          results page and then closing the tab.
        </p>
        <p>
          The{' '}
          <a href={REUTERS} target="_blank" rel="noopener noreferrer">
            Reuters Institute at Oxford
          </a>{' '}
          measured the effect on the receiving end. Using data from the analytics company Chartbeat,
          they reported that Google organic search traffic to more than 2,500 sites fell by roughly a
          third globally, and by 38% in the United States, between November 2024 and November 2025.
          Worth being straight about the sample: those are news websites and apps in Chartbeat’s
          network, not local service businesses. Treat it as the direction the market is moving
          rather than a forecast for your own site.
        </p>
        <p>
          What this means for a business owner is simple enough. Fewer of the people searching for
          your service will land on your website than would have two years ago, and that shift is not
          something you caused or can undo.
        </p>
      </section>

      <section className="blog-section" id="s2">
        <h2>It’s Google, Not ChatGPT</h2>
        <p>
          Most of the worry we hear is about ChatGPT taking customers. The Reuters Institute measured
          this directly and found that referrals from ChatGPT are rising quickly but remain, in their
          words, little more than a rounding error. Google delivers roughly 500 times as many
          referrals as ChatGPT from search alone.
        </p>
        <p>
          That’s worth internalizing before you spend a dollar or an afternoon on it. The pressure on
          your traffic is coming from a change inside Google’s own results page. Anything you do
          about AI search should start there.
        </p>
      </section>

      <section className="blog-section" id="s3">
        <h2>Getting Cited Isn’t the Whole Answer</h2>
        <p>
          There’s a popular idea that the goal now is to get your business named inside the AI
          summary. Pew’s data complicates that. Only 1% of visits in their study included a click on
          a link inside the AI summary itself. Being cited put a business in front of a reader; it
          rarely brought that reader to the website.
        </p>
        <p>
          Pew also found that 88% of AI summaries cited three or more sources. Even when you are one
          of the names in the box, you are sharing that box.
        </p>
        <p>
          The honest read is that citation is worth having. It puts your name in front of someone at
          the moment they’re deciding, and that carries real credibility. It is not a traffic
          strategy by itself, and anyone selling it to you as one is selling you a number that the
          research does not support.
        </p>
      </section>

      <section className="blog-section" id="s4">
        <h2>You Don’t Have to Outrank Everyone to Get Cited</h2>
        <p>
          Here is the finding that should change how you think about this. Researchers at Washington
          University in St. Louis ran{' '}
          <a href={WASHU} target="_blank" rel="noopener noreferrer">
            55,393 trending searches over a 40-day window in March and April 2026
          </a>{' '}
          and checked where AI Overviews were pulling their sources from. Nearly 30% of the domains
          cited in AI Overviews did not appear anywhere on the first page of ordinary results for
          that same search.
        </p>
        <p>
          The same study found that the domains AI Overviews cite are, on average, measurably more
          credible than the first-page results sitting right next to them.
        </p>
        <p>
          Read those two findings together and the picture changes. AI Overviews are not simply
          reading off the top of the rankings. They pull from a partly separate pool, and they lean
          toward sources that look trustworthy on the specific question being asked. A business that
          cannot outrank a national directory on page one can still be a source an AI Overview
          quotes.
        </p>
        <p>
          One caveat, stated plainly: this is a preprint under review rather than a finished,
          peer-reviewed paper. Treat it as strong early evidence rather than settled fact.
        </p>
      </section>

      <section className="blog-section" id="s5">
        <h2>Google Says There’s No Special Trick</h2>
        <p>
          Google publishes its own documentation on this, called{' '}
          <a href={GOOGLE_AI_DOCS} target="_blank" rel="noopener noreferrer">
            AI Features and Your Website
          </a>
          . It states plainly: “There are no additional requirements to appear in AI Overviews or AI
          Mode, nor other special optimizations necessary.” The same page adds: “You don’t need to
          create new machine readable files, AI text files, or markup to appear in these features.
          There’s also no special schema.org structured data that you need to add.”
        </p>
        <p>
          Danny Sullivan, a director within Google Search and Google’s longtime Search Liaison, put
          it more bluntly in his{' '}
          <a href={WORDCAMP} target="_blank" rel="noopener noreferrer">
            WordCamp US keynote
          </a>{' '}
          in August 2025: “Good SEO is good GEO, or AEO, AIO, LLM SEO, or LMNOPO.” He added that what
          site owners have been doing for search engines generally remains “perfectly fine and still
          the things that you should be doing.”
        </p>
        <p>
          That is genuinely good news. It means there is no second playbook to learn, and nothing new
          that you have to go hire someone to do. The work that makes your business findable in
          ordinary search results is the same work that makes it eligible to show up in an AI answer.
          If you want that list in full, we covered it in{' '}
          <Link href="/blog/google-ranking-factors-2026">
            11 Google Ranking Factors That Actually Matter for Service Businesses in 2026
          </Link>
          .
        </p>
      </section>

      <div className="blog-leadin">
        <p>
          Since the fundamentals are the same, the useful question is which fundamentals deserve your
          attention first. The two below are not the only things that matter and they are not a
          complete list. They are the two with the most independent evidence behind them and the most
          direct relevance to a business whose work happens at customer locations.
        </p>
      </div>

      {/* ── 01 ── */}
      <section className="blog-factor" id="f1">
        <div className="blog-factor-head">
          <div className="blog-factor-num" aria-hidden="true">
            01
          </div>
          <div className="blog-factor-titlewrap">
            <h2>Specific, Checkable Facts</h2>
          </div>
        </div>
        <div className="blog-factor-body">
          <h3>What the Research Shows</h3>
          <p>
            The Washington University study found that how a search is phrased makes an enormous
            difference to whether an AI Overview shows up at all. Question-form searches triggered
            one 64.7% of the time. Every other kind of search triggered one 9.5% of the time.
          </p>

          <figure
            className="blog-fig"
            role="group"
            aria-label="Chart: share of Google searches that produce an AI Overview, by query type. Question-form searches, 64.7 percent. All other searches, 9.5 percent."
          >
            <div className="blog-fig-title">Share of Google searches that produce an AI Overview</div>
            <div className="blog-fig-sub">
              By how the search is phrased. Question-form searches trigger an AI Overview roughly
              seven times as often.
            </div>

            <div className="blog-bar-row">
              <div className="blog-bar-label">
                Question-form searches{' '}
                <span className="blog-bar-hint">(“how much does a new front door cost”)</span>
              </div>
              <div className="blog-bar-track">
                <div className="blog-bar-rail">
                  <div className="blog-bar-fill" style={{ width: '64.7%' }} />
                </div>
                <div className="blog-bar-val">64.7%</div>
              </div>
            </div>

            <div className="blog-bar-row">
              <div className="blog-bar-label">
                All other searches <span className="blog-bar-hint">(“front door installer”)</span>
              </div>
              <div className="blog-bar-track">
                <div className="blog-bar-rail">
                  <div className="blog-bar-fill" style={{ width: '9.5%' }} />
                </div>
                <div className="blog-bar-val">9.5%</div>
              </div>
            </div>

            <div className="blog-fig-axis">
              <span>0%</span>
              <span>100% of searches</span>
            </div>

            <figcaption className="blog-fig-source">
              Source: Xu, Iqbal &amp; Montgomery, Washington University in St. Louis,{' '}
              <a href={WASHU} target="_blank" rel="noopener noreferrer">
                “Measuring Google AI Overviews”
              </a>{' '}
              (2026). Based on 55,393 trending searches, March 13 – April 21, 2026. Preprint under
              review. Example searches are illustrative.
            </figcaption>
          </figure>

          <p>
            Pew’s browsing study found the same pattern a year earlier using a completely different
            method. Searches beginning with “who,” “what,” “when,” or “why” produced an AI summary
            60% of the time, and only 8% of one- or two-word searches did, compared with 53% of
            searches of 10 or more words. Two independent studies, a year apart, using different
            methods and slightly different definitions of a question-style search, landed within five
            points of each other. That is about as solid as a pattern gets in this field.
          </p>
          <p>
            Those long, spoken-sounding questions are exactly the kind a homeowner asks before hiring
            someone. Separately, researchers at Princeton and Georgia Tech tested nine content
            tactics across roughly 10,000 queries on a system built to mimic a generative search
            engine, published as{' '}
            <a href={GEO_PAPER} target="_blank" rel="noopener noreferrer">
              GEO: Generative Engine Optimization
            </a>
            . Adding citations to sources, adding direct quotations, and adding statistics were among
            the tactics that measurably improved a page’s visibility in AI-generated answers, with
            the strongest improving visibility by roughly 30 to 40% on the study’s metrics. Worth
            being straight about: that study tested general web content, not local service business
            pages, so treat it as a strong signal rather than proof about your market.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Write down the five questions customers actually ask you on the phone before they book.
            Put each one on your website as a heading, worded the way a customer would say it out
            loud, with a direct answer underneath it in two or three sentences. Then go through your
            service pages and replace the general claims with real particulars: the actual product
            you installed, the street or neighborhood, the date, what the crew ran into and how it
            got handled. A finished job documented with real details is exactly this kind of
            material, which is what <Link href="/features/local-job-pages">Local Job Pages</Link> are
            built to publish.
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
            <h2>Consistent, Accurate Business Information</h2>
          </div>
        </div>
        <div className="blog-factor-body">
          <h3>What the Research Shows</h3>
          <p>
            This one comes straight from Google’s own policy rather than from any theory about how
            search works.{' '}
            <a href={GBP_GUIDELINES} target="_blank" rel="noopener noreferrer">
              Google’s guidelines for representing your business
            </a>{' '}
            require that you represent your business as it is consistently represented and recognized
            in the real world, across your storefront signage, your stationery, your website, and the
            way customers already know you. Business name, address, and service area have to be
            accurate and precise.
          </p>
          <p>
            That is a stated requirement, and it is the kind of thing that quietly drifts. A phone
            number changes, a suite number gets added, a directory listing keeps the name you used
            four years ago, and now three versions of your business exist across the web.
          </p>
          <h3 className="blog-action">Do This Week</h3>
          <p>
            Open three things side by side: your Google Business Profile, the contact page and footer
            of your website, and your top directory listings. Compare the business name, the street
            address, and the phone number character for character, and fix anything that doesn’t
            match. Then keep the profile active rather than letting it sit — a short post when a job
            wraps up is enough, and the{' '}
            <Link href="/features/gbp-post-generator">GBP Post Generator</Link> writes those from the
            job you already logged.
          </p>
        </div>
      </section>

      <div className="blog-closing">
        <h2>Where This Leaves You</h2>
        <p>
          Nobody gets to opt out of AI Overviews. Google decides when one appears, and the Washington
          University researchers measured that at 13.7% of searches overall during their study
          window, concentrated heavily on the question-style searches people use when they are
          deciding who to hire. Getting cited in one is worth having and it is not a guaranteed
          traffic win. Those are the real constraints, and pretending otherwise would be dishonest.
        </p>
        <p>
          What did not change is the part you control. Google’s own documentation says there is
          nothing special to add, and the same fundamentals still decide whether your business is
          eligible to show up. The encouraging part is that eligibility does not appear to require
          outranking everyone first. The work that pays off is having real, specific, verifiable
          proof of the jobs you’ve finished, published somewhere Google can actually find it. That is
          a byproduct of documenting your work properly rather than a special AI tactic, which is why
          it’s worth doing regardless of what the results page looks like next year.
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

      <BlogCta source="blog/ai-overviews-what-the-data-shows" />
    </>
  )
}
