import Link from 'next/link'

/**
 * Single source of truth for the FAQ. The visible section below and the
 * FAQPage JSON-LD in the route both read from this, so the two can't drift
 * apart — mismatched schema is a real risk, not a cosmetic one.
 */
export const FAQ_ITEMS = [
  {
    q: 'Is there a free local SEO audit tool?',
    a: 'No single free tool audits local SEO end to end, because the job spans four different systems. The closest free combination is Ahrefs Free for the site audit, the Rich Results Test for structured data, PageSpeed Insights for page performance, and the Google Business Profile Performance report for the listing. Running all four costs nothing.',
  },
  {
    q: 'Is there a free Google Business Profile audit tool?',
    a: 'Google does not publish one, and the free third-party scanners mostly check whether fields are filled in, which you can see inside the dashboard yourself. The more useful free audit is to confirm that the primary category is the one customers would pick, the service area lists the towns you work in, the hours are current, the services are itemized, and recent photos exist. The Performance report then tells you what that profile is producing.',
  },
  {
    q: 'Can you do local SEO yourself without paying an agency?',
    a: 'Yes. Every tool required costs nothing, and the click paths above are the whole method. What you take on by doing it yourself is the labor that follows each finished job: the photographing, the writing, the posting and the asking.',
  },
  {
    q: 'How often should these free tools be checked?',
    a: 'The publishing surfaces need attention only when something about the business changes, apart from posting, which is worth doing weekly. Measurement tools are worth opening monthly, since local data moves too slowly for a weekly check to tell you anything. Research is worth revisiting quarterly, or whenever you add a service or a town. Diagnostic tools are worth running after any website change.',
  },
]

const TOC = [
  { id: 'ranking-factors', label: 'Local SEO Ranking Factors' },
  { id: 'measure', label: 'Tools That MEASURE Performance' },
  { id: 'diagnose', label: 'Tools That DIAGNOSE Your Website' },
  { id: 'research', label: 'Tools That RESEARCH Keywords and Demand' },
  { id: 'publish', label: 'Tools That PUBLISH and IMPROVE Your Presence' },
  { id: 'where-stop', label: 'Where the Free Tools Stop' },
  { id: 'order', label: 'The Order to Use Them In' },
  { id: 'faq', label: 'Common Questions' },
]

const SEARCH_CONSOLE = 'https://search.google.com/search-console'
const GBP_HOME = 'https://business.google.com'
const GBP_REVIEW_LINK = 'https://support.google.com/business/answer/16816815'
const GBP_SERVICE_AREA = 'https://support.google.com/business/answer/9157481'
const BING_WEBMASTER = 'https://www.bing.com/webmasters'
const BING_KEYWORD_HELP = 'https://www.bing.com/webmasters/help/keyword-research-628070b6'
const BING_PLACES = 'https://www.bingplaces.com'
const ANALYTICS = 'https://analytics.google.com'
const CLARITY = 'https://clarity.microsoft.com'
const AHREFS_FREE = 'https://ahrefs.com/webmaster-tools'
const RICH_RESULTS = 'https://search.google.com/test/rich-results'
const LOCALBUSINESS_DOCS =
  'https://developers.google.com/search/docs/appearance/structured-data/local-business'
const SCHEMA_VALIDATOR = 'https://validator.schema.org'
const PAGESPEED = 'https://pagespeed.web.dev'
const SCREAMING_FROG = 'https://www.screamingfrog.co.uk/seo-spider/'
const KEYWORD_PLANNER = 'https://ads.google.com/aw/keywordplanner'
const TRENDS = 'https://trends.google.com'
const APPLE_BUSINESS = 'https://www.apple.com/business/connect'
const YELP_BIZ = 'https://biz.yelp.com'
const FACEBOOK_PAGES = 'https://www.facebook.com/pages/create'
const NEXTDOOR = 'https://business.nextdoor.com/local'

/** Vendor product pages are cited here only for their own free-tier terms,
 *  which is the one fact those pages are authoritative for. Every claim about
 *  how search works traces to Google's or Microsoft's own documentation. */
const SOURCES = [
  {
    href: LOCALBUSINESS_DOCS,
    label: 'Google Search Central, LocalBusiness structured data documentation',
    detail: ' — last updated 8 September 2026; the instruction to validate markup with the Rich Results Test.',
  },
  {
    href: 'https://support.google.com/business/answer/7091',
    label: 'Google Business Profile Help, "Tips to improve your local ranking on Google"',
    detail: ' — relevance, distance, and prominence.',
  },
  {
    href: GBP_SERVICE_AREA,
    label: 'Google Business Profile Help, service areas',
    detail: ' — the twenty-area cap and the roughly two-hour driving boundary.',
  },
  {
    href: GBP_REVIEW_LINK,
    label: 'Google Business Profile Help, review link and QR code',
    detail: ' — generating a review link without third-party software.',
  },
  {
    href: BING_KEYWORD_HELP,
    label: 'Bing Webmaster Tools Help, keyword research',
    detail: ' — exact Bing search volumes and the question filter.',
  },
  {
    href: AHREFS_FREE,
    label: 'Ahrefs, free tier product page',
    detail: ' — what the free tier includes, and that it carries no expiry.',
  },
  {
    href: SCREAMING_FROG,
    label: 'Screaming Frog, SEO Spider product page',
    detail: ' — the 500-URL limit on the free edition.',
  },
  {
    href: NEXTDOOR,
    label: 'Nextdoor for Business, local business pages',
    detail: ' — business pages are free to create.',
  },
  {
    href: APPLE_BUSINESS,
    label: 'Apple, Apple Business Connect',
    detail: ' — Apple Business Connect is now part of Apple Business, and the service is free.',
  },
]

export default function BestFreeLocalSeoTools() {
  return (
    <>
      <p className="blog-lead">
        The best free local SEO tools fall into four groups: tools that publish your business, tools
        that measure performance, tools that research what people search for, and tools that
        diagnose the website. A genuinely free tool exists in every group. The highest-return action
        on the list is claiming the listing surfaces outside Google.
      </p>

      <div className="blog-leadin">
        <p>
          The tools below are helpful for a single-location or small multi-location business doing
          its own local SEO.
        </p>
      </div>

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

      <section className="blog-section" id="ranking-factors">
        <h2>Local SEO Ranking Factors</h2>

        <p>
          Every tool on this list can be categorized into one of four buckets. Some of the tools and
          resources are &ldquo;set it and forget it&rdquo; while others are intended for active use
          periodically. I hope you find these useful and discover a new resource that will help you
          grow your business.
        </p>

        <ul>
          <li>
            <strong>Performance Measurement tools</strong> give you an idea of how your site is
            performing &mdash; how many people visit your page, what people click, what people
            search for to find your page, and so on.
          </li>
          <li>
            <strong>Diagnostic tools</strong> tell you whether your website is technically capable
            of being found by people. Your site needs to be written with certain underlying code so
            Google can tell what is there and provide that information to people who might be
            searching for you.
          </li>
          <li>
            <strong>Research tools</strong> tell you which words your customers use before you
            commit a page or a profile to those words so that people can find you.
          </li>
          <li>
            <strong>Publishing tools</strong> give you the ability to actually edit your page on the
            internet using everything you&rsquo;ve learned, because a claimed listing, a completed
            profile and a published page are all new facts a search engine can find.
          </li>
        </ul>

        <p>
          The end goal of all of this is getting more customers, repeatedly and effortlessly for as
          cheap (or free) as possible. To do that, we need to at least understand the basics of how
          this all works in plain language. Search engines (like Google) and other platforms all
          work the same basic way. Someone searches for something, perhaps a service you provide,
          and the platform tries to show the BEST result to the person that typed in the search
          query. So, if someone searches for &ldquo;party services for kids near me&rdquo; and you
          run &ldquo;Larry&rsquo;s Slip-N-Slides&rdquo;, you want to show up at the top of Google,
          or whatever other platform, so that the searcher is more likely to click your page and
          book old Larry to do his slip-n-slide thing and make money. I think you get the idea. The
          details of how all of that works are beyond the scope of this article, and I&rsquo;ve
          written other articles that explain this more in our <Link href="/blog">blog index</Link>.
        </p>

        <p>
          However, before we get to the free tools, it is really important that you understand a
          couple more things. Your business info, services and product offerings, location, and the
          rest need to be consistent wherever you are listed online, especially between your own
          Google Business Profile and your website. When your business name, address and phone
          number, known as NAP, match exactly between your Google Business Profile, your website,
          and every other place your business is listed, Google has a confirmed fact rather than a
          discrepancy to resolve. The same applies to your services. If your website lists door
          installation and door repair as separate services, your profile&rsquo;s categories and
          service list should name them the same way.
        </p>

        <p>
          All we are trying to do here is to say &ldquo;Hey Google, I am a REAL business, I am
          AWESOME and I have REAL customers that LOVE me, I do these EXACT SERVICES in these AREAS,
          and here is the PROOF.&rdquo; When search engines (and now AI models) see this, it becomes
          much easier for them to pull your card out of the pile and present it on a silver platter
          to a random lady down the road searching for the exact service that you offer, instead of
          your competitors. Alright, rant over. Y&rsquo;all get it, here&rsquo;s what you came for.
        </p>
      </section>

      <section className="blog-section" id="measure">
        <h2>Free tools that MEASURE how your rankings are performing</h2>

        <p>
          Each measurement tool provides unique insight and pieces of information that can help you
          improve your presence online.
        </p>

        <h3>Google Search Console (GSC)</h3>
        <p>
          GSC tells you what people actually searched for to find your website. This tool really is
          a must-have for anyone with a website online. It not only shows Google&rsquo;s robots how
          to read your website and understand what you do as a business, but also provides insights
          such as overall impressions (how many times people see your link), number of clicks, which
          pages on your site people click on, number of overall clicks over time, and other helpful
          information. Search Console is for websites, not Google Business Profiles. Search Console
          is free at{' '}
          <a href={SEARCH_CONSOLE} target="_blank" rel="noopener noreferrer">
            search.google.com/search-console
          </a>
          .
        </p>

        <h3>Google Business Profile Performance report</h3>
        <p>
          The Performance report inside your profile answers the question Search Console cannot: how
          many people called you, asked for directions, or clicked through to your website from the
          listing. For a company whose customers call rather than fill in forms, the call count is
          the closest thing here to a revenue number.
        </p>

        <h3>Bing Webmaster Tools performance reports</h3>
        <p>
          Bing Webmaster Tools is free at{' '}
          <a href={BING_WEBMASTER} target="_blank" rel="noopener noreferrer">
            bing.com/webmasters
          </a>{' '}
          and reports the same shape of data as Search Console for Bing traffic.
        </p>

        <h3>Google Analytics 4</h3>
        <p>
          Analytics is free at{' '}
          <a href={ANALYTICS} target="_blank" rel="noopener noreferrer">
            analytics.google.com
          </a>{' '}
          and answers what visitors did after they arrived on your website, including which pages
          they read and which ones they left immediately. There are all kinds of reports in this
          tool that are incredibly helpful, from generating leads, to driving more sales, and
          improving customer retention.
        </p>

        <h3>Microsoft Clarity</h3>
        <p>
          Clarity is free at{' '}
          <a href={CLARITY} target="_blank" rel="noopener noreferrer">
            clarity.microsoft.com
          </a>
          , records real sessions, and builds heatmaps of where people click and how far they
          scroll. A handful of recordings of real user behavior on your pricing or quote page can
          give you a better understanding of when and where people bail on your site, or follow
          through and actually call you, better than most reporting tools do.
        </p>

        <h3>Ahrefs Free</h3>
        <p>
          Ahrefs Free, formerly Ahrefs Webmaster Tools, gives verified site owners Site Audit, Site
          Explorer for their own domains, and Web Analytics. Ahrefs states that the tier stays free
          indefinitely and asks for no credit card (
          <a href={AHREFS_FREE} target="_blank" rel="noopener noreferrer">
            Ahrefs
          </a>
          ). Verification is limited to domains you own, so the free tier will not let you study a
          competitor.
        </p>

        <p>
          <strong>Next best action.</strong> Verify your site in{' '}
          <a href={SEARCH_CONSOLE} target="_blank" rel="noopener noreferrer">
            Search Console
          </a>
          , then open your Google Business Profile, click Performance, set the range to the last 3
          months, and write down the calls, direction requests and website clicks somewhere you will
          still have in ninety days. Without that written baseline, every later change is
          unmeasurable.
        </p>
      </section>

      <section className="blog-section" id="diagnose">
        <h2>Free tools that DIAGNOSE and fix the website itself</h2>

        <p>
          These tools answer whether your site is technically capable of ranking. None of the other
          tools on this list will help you if you are invisible to search engines and AI models
          (AEO).
        </p>

        <h3>Rich Results Test</h3>
        <p>
          Google&rsquo;s LocalBusiness structured data documentation, last updated 8 September 2026,
          instructs site owners to validate their markup with the Rich Results Test at{' '}
          <a href={RICH_RESULTS} target="_blank" rel="noopener noreferrer">
            search.google.com/test/rich-results
          </a>{' '}
          (
          <a href={LOCALBUSINESS_DOCS} target="_blank" rel="noopener noreferrer">
            Google Search Central
          </a>
          ). The test reads your page the way Google does and tells you whether your business name,
          address, hours and service area are understood or ignored.
        </p>

        <h3>Schema Markup Validator</h3>
        <p>
          The Schema Markup Validator at{' '}
          <a href={SCHEMA_VALIDATOR} target="_blank" rel="noopener noreferrer">
            validator.schema.org
          </a>{' '}
          checks markup against the schema.org standard without applying Google-specific rules. Use
          the validator when the Rich Results Test flags something and you need to know whether the
          markup is malformed or simply not eligible for a Google feature.
        </p>

        <h3>PageSpeed Insights</h3>
        <p>
          PageSpeed Insights is free at{' '}
          <a href={PAGESPEED} target="_blank" rel="noopener noreferrer">
            pagespeed.web.dev
          </a>{' '}
          and reports how your page loads on a phone. A homeowner searching from a phone gets the
          mobile version of your site, so the mobile score is the one to read first.
        </p>

        <h3>Screaming Frog free edition</h3>
        <p>
          The free edition of Screaming Frog crawls up to 500 URLs and includes broken-link
          detection, XML sitemap generation, JavaScript rendering and structured data validation (
          <a href={SCREAMING_FROG} target="_blank" rel="noopener noreferrer">
            Screaming Frog
          </a>
          ). Five hundred URLs covers most door and fence company websites completely.
        </p>

        <p>
          <strong>Next best action.</strong> Paste your main service page URL into the{' '}
          <a href={RICH_RESULTS} target="_blank" rel="noopener noreferrer">
            Rich Results Test
          </a>
          , then the same URL into{' '}
          <a href={PAGESPEED} target="_blank" rel="noopener noreferrer">
            PageSpeed Insights
          </a>
          , and read the Mobile tab first.
        </p>
      </section>

      <section className="blog-section" id="research">
        <h2>Free tools to RESEARCH local keywords and demand</h2>

        <p>The strongest free research tool on this list is not Google&rsquo;s.</p>

        <h3>Bing Webmaster Tools keyword research</h3>
        <p>
          The keyword research tool inside Bing Webmaster Tools is free, reports exact Bing search
          volumes rather than ranges, and includes a filter for question-shaped queries (
          <a href={BING_KEYWORD_HELP} target="_blank" rel="noopener noreferrer">
            Bing Webmaster Tools Help
          </a>
          ). Exact numbers from a smaller search engine are easier to plan against than rounded
          numbers from a larger one.
        </p>

        <h3>Google Keyword Planner</h3>
        <p>
          Keyword Planner is free with a Google Ads account at{' '}
          <a href={KEYWORD_PLANNER} target="_blank" rel="noopener noreferrer">
            ads.google.com/aw/keywordplanner
          </a>
          . Creating the account does not require you to run an ad.
        </p>

        <h3>Google autocomplete</h3>
        <p>
          Autocomplete requires no account at all. Typing &ldquo;garage door repair&rdquo; into
          Google and reading the suggestions returns the real phrasing people use, ordered by how
          commonly they use it. The ordering is the fastest way to discover that your customers
          search for something other than what you call the service.
        </p>

        <h3>Google Trends</h3>
        <p>
          Trends is free at{' '}
          <a href={TRENDS} target="_blank" rel="noopener noreferrer">
            trends.google.com
          </a>{' '}
          and confirms whether a term has real, sustained interest and how it moves through the
          year. Seasonal demand for roofing and HVAC work shows up here before it shows up in your
          phone log.
        </p>

        <p>
          <strong>Next best action.</strong> Type your main service plus your city into Google and
          write down every autocomplete suggestion, run the same seed through{' '}
          <a href={BING_WEBMASTER} target="_blank" rel="noopener noreferrer">
            Bing Webmaster Tools keyword research
          </a>{' '}
          for exact volumes, then check the strongest candidates in{' '}
          <a href={TRENDS} target="_blank" rel="noopener noreferrer">
            Google Trends
          </a>
          .
        </p>
      </section>

      <section className="blog-section" id="publish">
        <h2>Free tools that PUBLISH and IMPROVE your local presence</h2>

        <p>These are the only tools in this article that change what exists online about your business.</p>

        <h3>Google Business Profile</h3>
        <p>
          Google Business Profile feeds Google Maps and the local results, and it is free to claim
          and manage at{' '}
          <a href={GBP_HOME} target="_blank" rel="noopener noreferrer">
            business.google.com
          </a>
          . The profile also generates a review link and a printable QR code natively, so you can
          ask a customer for a review without buying anything to do it (
          <a href={GBP_REVIEW_LINK} target="_blank" rel="noopener noreferrer">
            Google Business Profile Help
          </a>
          ). The setting most often left wrong is the service area: a door company that drives to
          every job should be set up as a service-area business listing the towns it works in,
          instead of carrying a storefront address where nobody takes appointments.{' '}
          <a href={GBP_SERVICE_AREA} target="_blank" rel="noopener noreferrer">
            Google&rsquo;s documentation
          </a>{' '}
          says a business may set up to 20 service areas, and that the boundaries of your overall
          area should not be more than about two hours of driving time from where your business is
          based. You need to maximize the usage of all service areas where you are looking to
          increase your presence and make sure your Google Business Profile is set up this way.
        </p>

        <h3>Bing Places for Business</h3>
        <p>
          Bing Places is a free business listing you claim directly at{' '}
          <a href={BING_PLACES} target="_blank" rel="noopener noreferrer">
            bingplaces.com
          </a>
          . Bing&rsquo;s search volume is smaller than Google&rsquo;s, and the listing takes one
          sitting to complete and then stays done.
        </p>

        <h3>Apple Business</h3>
        <p>
          Apple confirms on its own support site that Apple Business Connect is now part of Apple
          Business, at{' '}
          <a href={APPLE_BUSINESS} target="_blank" rel="noopener noreferrer">
            apple.com/business/connect
          </a>
          . Apple&rsquo;s product pages describe the service as free, and the listing you manage
          there controls how your business appears in Apple Maps, Siri, Wallet and Messages.
        </p>

        <h3>Yelp business account</h3>
        <p>
          A Yelp business account is free to claim at{' '}
          <a href={YELP_BIZ} target="_blank" rel="noopener noreferrer">
            biz.yelp.com
          </a>
          . Claiming the account gives you control of the information on a page that already exists
          whether you manage it or not.
        </p>

        <h3>Facebook Page</h3>
        <p>
          A Facebook Page for the business is free to create at{' '}
          <a href={FACEBOOK_PAGES} target="_blank" rel="noopener noreferrer">
            facebook.com/pages/create
          </a>
          .
        </p>

        <h3>Nextdoor business page</h3>
        <p>
          Nextdoor business pages are free to create at{' '}
          <a href={NEXTDOOR} target="_blank" rel="noopener noreferrer">
            business.nextdoor.com/local
          </a>
          . Nextdoor is organized by neighborhood instead of by keyword, which is how a lot of
          roofing, HVAC and pressure washing work gets passed around anyway, one neighbor telling
          another.
        </p>

        <h3>ProjectCheckin free plan</h3>
        <p>
          <Link href="/features/local-job-pages">ProjectCheckin</Link> turns your REAL jobs into
          REAL data that tells Google, AI, and other search engines that your company is the best in
          the area for the product or service you offer. Every job you complete is like an
          electronic sign post in the ground (with real geo-coordinates) and when Google sees this
          it thinks &ldquo;Dad-gum, this local business is doing work all over here, I better show
          this to more people looking.&rdquo; Also, it is super simple to use. Basically all that
          happens is your crew takes pictures of their finished work on their phone or tablet, and
          ProjectCheckin does all the technical stuff that search engines delight in, and publishes
          it as a page on the web that people see (with booking links, call links, website links,
          and the rest). The free plan publishes as many job pages as you want, with five photos per
          job and fifty photos a month.
        </p>

        <p>
          <strong>Next best action.</strong> Claim the three listings you most likely do not have
          yet. Go to{' '}
          <a href={BING_PLACES} target="_blank" rel="noopener noreferrer">
            bingplaces.com
          </a>
          , select New User, search your business name and city, then claim or create the listing.
          Go to{' '}
          <a href={APPLE_BUSINESS} target="_blank" rel="noopener noreferrer">
            apple.com/business/connect
          </a>
          , sign in with an Apple Account, and add your business. Then create your page at{' '}
          <a href={NEXTDOOR} target="_blank" rel="noopener noreferrer">
            business.nextdoor.com/local
          </a>
          .
        </p>
      </section>

      <section className="blog-section" id="where-stop">
        <h2>Where the free tools stop</h2>

        <p>
          Every tool above gives you either a surface to publish on or a means to understand
          performance. Enhancing your Google Business Profile will help you in map ranking more
          quickly, while tools like Search Console, Clarity and Ahrefs Free will paint a clearer
          picture of website performance, which can become a compounding asset over time whose value
          continues growing and bringing you customers.
        </p>

        <p>
          None of those tools create the value for you though. After a job is finished, someone has
          to photograph the completed work, write about it in a nice way, post it and the details of
          the job manually in your Google Business Profile, create a new blog space on your website,
          write, format, post, on and on. All of this can take hours and quickly cause burnout, and
          before you know it you just give up on the process because it is a MASSIVE commitment of
          time that doesn&rsquo;t seem to pay off for you. That&rsquo;s not to mention constantly
          asking people for reviews, which is an entirely different set of challenges. A tool like{' '}
          <Link href="/features/review-requests">ProjectCheckin</Link> will completely remove the
          burden of these tasks from you to allow you to focus on your business and allow your
          website and Google Business Profile to grow organically. Book a demo after you&rsquo;ve
          taken a closer look. We won&rsquo;t try to sell you anything (we don&rsquo;t even have
          salespeople), but will just be glad to walk you through the tool if you have interest.
        </p>

        <div className="blog-table-wrap">
          <table className="blog-table">
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Job</th>
                <th scope="col">Free tier</th>
                <th scope="col">Where it stops</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Google Business Profile</td><td>Publish</td><td>Listing, posts, photos, review link and QR code</td><td>Google only</td></tr>
              <tr><td>Bing Places</td><td>Publish</td><td>Full listing management</td><td>Bing only</td></tr>
              <tr><td>Apple Business</td><td>Publish</td><td>Apple Maps, Siri, Wallet, Messages listing</td><td>Apple surfaces only</td></tr>
              <tr><td>Yelp business account</td><td>Publish</td><td>Claim and manage the listing</td><td>Claiming only</td></tr>
              <tr><td>Facebook Page</td><td>Publish</td><td>Create and manage the page</td><td>Reach depends on posting</td></tr>
              <tr><td>Nextdoor business page</td><td>Publish</td><td>Create the business page</td><td>One neighborhood network</td></tr>
              <tr><td>ProjectCheckin</td><td>Publish</td><td>Completed jobs published as indexable pages</td><td>5 photos per job, 50 photos a month</td></tr>
              <tr><td>Google Search Console</td><td>Measure</td><td>Queries, impressions, positions for your site</td><td>Website only, not the listing</td></tr>
              <tr><td>GBP Performance report</td><td>Measure</td><td>Calls, direction requests, website clicks</td><td>Listing activity only, not the website</td></tr>
              <tr><td>Bing Webmaster Tools</td><td>Measure</td><td>Performance reports</td><td>Bing only</td></tr>
              <tr><td>Google Analytics 4</td><td>Measure</td><td>On-site behavior</td><td>Nothing about search visibility</td></tr>
              <tr><td>Microsoft Clarity</td><td>Measure</td><td>Session recordings, heatmaps</td><td>On-site behavior only</td></tr>
              <tr><td>Ahrefs Free</td><td>Measure</td><td>Site Audit, Site Explorer, Web Analytics</td><td>Verified own domains only</td></tr>
              <tr><td>Bing keyword research</td><td>Research</td><td>Exact Bing volumes, question filter</td><td>Bing volumes, not Google&rsquo;s</td></tr>
              <tr><td>Google Keyword Planner</td><td>Research</td><td>Keyword ideas and forecasts</td><td>Needs a Google Ads account</td></tr>
              <tr><td>Google autocomplete</td><td>Research</td><td>Real query phrasing and ordering</td><td>No volume figures</td></tr>
              <tr><td>Google Trends</td><td>Research</td><td>Relative interest over time</td><td>Relative, not absolute</td></tr>
              <tr><td>Rich Results Test</td><td>Diagnose</td><td>Google-eligible schema validation</td><td>One URL at a time</td></tr>
              <tr><td>Schema Markup Validator</td><td>Diagnose</td><td>schema.org validation</td><td>No Google-specific checks</td></tr>
              <tr><td>PageSpeed Insights</td><td>Diagnose</td><td>Mobile and desktop performance</td><td>One URL at a time</td></tr>
              <tr><td>Screaming Frog free</td><td>Diagnose</td><td>500-URL crawl, sitemaps, schema</td><td>500 URLs, no scheduling</td></tr>
            </tbody>
          </table>
          <p className="blog-table-caption">
            What each free tier includes, and the limit at which it stops.
          </p>
        </div>
      </section>

      <div className="blog-leadin">
        <p>
          Your time is your most valuable asset. The free tools listed here will certainly help you
          if you use them regularly; the question is whether or not you will maintain consistency
          over a period of time with all other business priorities and endeavors. External hires,
          third parties, and agencies are far too expensive to throw money at, often times only to
          yield subpar work.
        </p>
        <p>
          <strong>Next best action.</strong> Put one of the four tasks on the calendar for a fixed
          day this week, and leave the other three off it.
        </p>
      </div>

      <section className="blog-section" id="order">
        <h2>The order to use them in</h2>

        <p>
          Choose a measuring tool, and start with Google Search Console and Google Analytics at a
          minimum. Measuring performance will give you an idea of where improvements can occur.
          Diagnostic tools can be run concurrently. The goal with both is to find weak areas and
          then make them better. Once that&rsquo;s done, choose a research tool to understand HOW to
          improve the weak area, and then a publishing tool to APPLY the change. Then measure,
          iterate, and repeat.
        </p>

        <ol>
          <li>Connect your measurement tools and record performance to date.</li>
          <li>
            Diagnose and fix your website, starting with your main service page and not the whole
            site.
          </li>
          <li>Research the phrasing your customers use, in your own town, before writing any new page.</li>
          <li>
            Claim the publishing surfaces you do not own yet, starting with Bing Places, Apple
            Business and Nextdoor.
          </li>
          <li>
            Complete (or update) your Google Business Profile properly, with the service area set
            correctly, services offered, review link saved, and every field filled out. This could
            be an entire article of its own.
          </li>
          <li>Start the recurring work after each finished job.</li>
        </ol>

        <p>
          <strong>Next best action.</strong> Open{' '}
          <a href={BING_PLACES} target="_blank" rel="noopener noreferrer">
            bingplaces.com
          </a>{' '}
          today, search your business name and city, and finish the claim in one sitting. Open and
          create a profile on Google Search Console and Google Analytics for additional insight.
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
        <h2>See What ProjectCheckin Does With a Finished Job</h2>
        <p>
          Your crew photographs the job on site, ProjectCheckin writes it up, and the finished job
          publishes as a page on the web that homeowners and search engines can find, so the jobs
          you have already done keep working on the next one.
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
