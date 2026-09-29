/**
 * Step content for the coach-mark chapters of onboarding.
 *
 * Each step names the route it lives on and the `data-tour` anchor it points
 * at. The overlay navigates to `path` if the customer is not already there,
 * waits for the anchor to render, then dims the page around it.
 *
 * `anchor` is optional: a step without one renders a centred card, which is
 * the right shape for a chapter's opening and closing remarks.
 */
export interface CoachStep {
  /** Route this step lives on. Omit to run on whatever page is already open. */
  path?: string
  anchor?: string
  title: string
  body: string
  /** Optional pointer to a guide that explains this control in full. */
  link?: { href: string; label: string }
  /**
   * Feature key from PLAN_FEATURES when this step describes something not on
   * every plan. The badge reads the required tier from that table, so it stays
   * correct if a feature moves between plans.
   */
  feature?: string
}

/**
 * One-off tip shown during Account Setup, between the welcome screen and the
 * business details form. It has no `path` because it runs on whichever page
 * the walkthrough is already on: /dashboard during a first run, and
 * /help/tutorial during a replay.
 */
export const NAV_TIP_CHAPTER = 90

export const COACH_STEPS: Record<number, CoachStep[]> = {
  // Chapter 2 — Create / Modify your Team. Bodies here are Keith's own wording.
  2: [
    {
      path: '/dashboard/team',
      title: 'Your team',
      body: 'Anyone in your business you decide to give access to lives here. Let’s walk through it.',
    },
    {
      path: '/dashboard/team',
      anchor: 'team-invite',
      title: 'Invite a teammate',
      body: 'Enter email of team member and send. They’ll receive account set up instructions to follow. We recommend adding front line workers who are able to capture details of completed customer work on site. These workers should only be assigned User access role.',
    },
    {
      path: '/dashboard/team',
      anchor: 'team-list',
      title: 'Who has access',
      body: 'Everyone on the account, with their role. Change or remove access from here at any time. Almost everyone in this list should have User access only. Owner access has full authority & should be limited.',
      link: { href: '/help/guides/team-roles', label: 'What each role can do' },
    },
  ],

  // Chapter 3 — Submit a Checkin
  3: [
    {
      path: '/check-in',
      title: 'Submitting a check-in',
      body: 'This is the form your crew fills in on site when a job is finished. Everything here can be corrected later from the Job Dashboard, so tell them to get the job recorded without worrying about the wording.',
    },
    {
      path: '/check-in',
      anchor: 'ci-installer',
      title: 'Employee name',
      body: 'This fills in automatically for anyone signed in with the User role, so your field crew never types it. Owners and admins enter it by hand, since they may be logging a job someone else did.',
    },
    {
      path: '/check-in',
      anchor: 'ci-address',
      title: 'The job address',
      body: 'Use the customer’s address where the work happened, not your office. This address places the finished job on the map and makes it findable for that area, so it is worth getting right. You can still correct it from the Job Dashboard.',
    },
    {
      path: '/check-in',
      anchor: 'ci-product',
      title: 'Product',
      body: 'Pick what was installed or serviced. You set this list yourself. Add your real products in the Account Center so it matches what you sell on your website.',
      link: { href: '/account', label: 'Manage your product list' },
    },
    {
      path: '/check-in',
      anchor: 'ci-notes',
      title: 'Notes',
      body: 'This does not need to read well. Get the detail down: finishes, patterns, materials, fixtures, custom work, anything tricky that got solved, and what the customer asked for. That detail is what people search for, and you can tidy the wording in the Job Dashboard later.',
    },
    {
      path: '/check-in',
      anchor: 'ci-customer',
      title: 'Customer info',
      body: 'This is optional, but worth capturing when your crew can. It is what lets you follow up with the customer and ask for a review. You can fill in the rest from the Job Dashboard if they only get part of it.',
    },
    {
      path: '/check-in',
      anchor: 'ci-photo-buttons',
      title: 'Adding photos',
      body: 'Take Photo opens the camera on the phone so the work is captured on site. From Library picks images already on the device, for when someone photographed the job separately.',
    },
    {
      path: '/check-in',
      anchor: 'ci-photos',
      title: 'Before and after',
      feature: 'before_after_tagging',
      body: 'Tag one photo BEFORE and one AFTER and they publish as a pair your customer can compare. Once a photo is tagged BEFORE, a Take After Photo button appears. It shows that before shot on screen as a faint overlay, so the second photo lines up on the same angle, distance and framing.',
    },
    {
      path: '/check-in',
      anchor: 'ci-submit',
      title: 'Submitting is safe',
      body: 'Submitting does not publish anything. A submitted check-in goes only to your internal Job Dashboard, where you review it and decide whether it goes public. Try one now as a test, then delete it afterwards.',
    },
  ],

  // Chapter 4 - Using your Job Dashboard. Runs against /dashboard?tutorial=1,
  // which seeds two obviously fake jobs so a brand new account still has rows,
  // expanded detail and action buttons for the overlay to point at.
  4: [
    {
      path: '/dashboard?tutorial=1',
      title: 'Your Job Dashboard',
      body: 'Every check-in your crew submits lands here first. Nothing reaches the public until you publish it from this screen. The two jobs shown are made-up examples so this walkthrough has something to point at.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-stats',
      title: 'The numbers at the top',
      body: 'Total Jobs is every check-in on the account. Today covers anything submitted since midnight, so you can see at a glance whether the crew logged their work. Published is the number now live on your website. Active Installers tells you how many people have submitted at least one job.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-portfolio',
      title: 'Your public portfolio',
      body: 'This line tells you whether your portfolio page is live and how many jobs Google has indexed so far. View Portfolio opens the page as a customer sees it.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-filters',
      title: 'Finding a job',
      body: 'All, Live and Draft split the list by whether a job has been published. The dropdowns filter by installer and by date, and change the sort order. The search box matches on address.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-row',
      title: 'A job row',
      body: 'Each row is one submitted job: the date it was captured, the address, the product, and how many photos came with it. Click anywhere on the row to open it.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-status',
      title: 'Draft or Live',
      body: 'Draft means the job is only visible to you. Live means it is published on your website and can be found in search. Every job arrives as a draft.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-publish',
      title: 'Publish and Unpublish',
      body: 'Publish puts the job on your website and, over time, into Google. Unpublish takes it back down. A job missing its city or state cannot be published until you add them, because the address is what makes the page findable.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-detail',
      title: 'What your crew captured',
      body: 'This panel holds the customer details, the address, who did the job and when, the notes from the field, and every photo they took. Each section has its own Edit link, so you can correct anything your crew typed in a hurry without sending the job back to them. The first photo becomes the cover unless you pick a different one.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-ai',
      feature: 'ai_job_description',
      title: 'Generate description with AI',
      body: 'This rewrites the rough notes from the field into a description fit for your website, using the product, the location and the details your crew recorded. You get to read and edit the result before anything is saved.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-actions',
      title: 'Sharing and posting',
      body: 'Copy Link copies the public address of the finished job page. Download All saves every photo from the job in one go. Post to Google Business sends the job to your Google listing as a post, once your listing is connected. Edit Check-In reopens the whole form.',
    },
    {
      path: '/dashboard?tutorial=1',
      anchor: 'jd-review',
      feature: 'review_request',
      title: 'Request Google Review',
      body: 'This texts or emails the customer a short personal message with a link straight to your Google review form. People are most likely to write one when you ask right after the work is finished.',
    },
  ],

  // Chapter 5 - Understanding Reporting. Each step says what a number tells
  // you and what moves it, never just restating the label.
  5: [
    {
      path: '/reporting',
      title: 'Reading your results',
      body: 'This page shows whether your published work is bringing people to you. The top section comes from your Google Business Profile, the listing people see on Google Maps. The section below it comes from Google Search results for your own website.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gbp-profile-views',
      feature: 'gbp_integration',
      title: 'Profile Views',
      body: 'Each profile view represents a person who saw your GBP listing among the other businesses nearby and chose to open yours. A strong star rating, plenty of reviews and recent photos help your listing rank and give people a reason to view your profile. This is also a good indicator of warm leads and purchase intent. If the number rises after a run of new reviews or posted jobs, those efforts are working and you are likely to convert some of these views to sales.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gbp-direction-requests',
      feature: 'gbp_integration',
      title: 'Direction Requests',
      body: 'These are people asking Google Maps for directions and a route to your physical address, which usually means they plan to visit. If your crew goes to the customer and nobody comes to you, expect this to stay low, and that is not a problem. If you have a showroom or office that people visit, treat this as an indicator of potential foot-traffic count.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gbp-search-appearances',
      feature: 'gbp_integration',
      title: 'Search Appearances',
      body: 'Read this in combination with Profile Views. If your GBP listing shows up in customer searches often but few people open it (high search appearances and low profile views), your rating, review count or job posts may need improvement, higher volume, or more time. Low search appearances will also be improved in this way, but we suggest also performing a review of your Google Profile to ensure it is 100% complete and accurate. Google ranks local listings on relevance, distance, and prominence, and says that complete, accurate business details and more positive reviews both help.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gsc-clicks',
      feature: 'gsc_integration',
      title: 'Clicks',
      body: 'These are visits to your business’s website from Google’s regular results, separate from anything that happens on your GBP listing. It is the closest figure on this page to real visitors from search. This will grow over time as you publish more jobs if you have integrated ProjectCheckin with your website pages.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gsc-impressions',
      feature: 'gsc_integration',
      title: 'Impressions',
      body: 'Compare this against Clicks. High impressions with low clicks means Google is showing your website listing in search results, but the listing is not being clicked, either because it is buried too far down the page and not being seen, or because the listing is seen but not enticing enough for the person to click to visit your website. Low impressions means Google does not think your page matches what people are searching for. In this case, keep increasing the volume of published jobs naming specific products and neighborhoods, and results will improve over time.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gsc-avg-position',
      feature: 'gsc_integration',
      title: 'Avg. Position',
      body: 'Lower is better, and 1 is the top result. The figure averages every search your site appeared in, so one strong page and many weak ones blend into a middling number. Once data comes in, the Top Search Queries table below shows which searches pull it up or down.',
    },
    {
      path: '/reporting',
      anchor: 'rpt-gbp-posts',
      feature: 'gbp_integration',
      title: 'Recent GBP Posts',
      body: 'Every job you send to your Google listing appears here with its date. Google displays your latest posts on the listing itself, so a long gap here means your listing has gone quiet to anyone looking at it. Where Google returned a link, clicking a row opens the live post.',
    },
  ],

  // Chapter 6 - Account Center. Deliberately does not repeat the setup steps
  // printed inside each Connections card; this chapter says what each thing is
  // and why it matters, and leaves the how-to where it already lives.
  6: [
    {
      path: '/account?tab=general',
      anchor: 'acct-tabs',
      title: 'Account Center',
      body: 'There are four tabs here. General holds your business details and your sign-in, Team controls who has access, and Billing is where your plan lives. Connections covers everything that carries your finished work out to Google and your website.',
    },
    {
      path: '/account?tab=general',
      anchor: 'acct-business',
      title: 'Who you are',
      body: 'This holds your business name, company email, phone and website. The name appears on every job page you publish and on the posts sent to your Google listing, and the website is what your portfolio links back to. Renaming the business once you are running is worth avoiding, so ProjectCheckin asks you to confirm before it saves that one.',
    },
    {
      path: '/account?tab=general',
      anchor: 'acct-trade',
      title: 'Trade or industry',
      body: 'Picking your trade tells ProjectCheckin what kind of work you do, and it loads a starting list of products and services to match. Changing it later leaves the list you already have alone, so you can switch without losing your own edits.',
    },
    {
      path: '/account?tab=general',
      anchor: 'acct-products',
      title: 'Products and services',
      body: 'This list is exactly what your crew picks from in the Product dropdown on the Check-In form, so it is worth matching what you really sell. Start from the defaults for your trade, then add, rename or remove entries until the list reads the way your team talks. Other always stays at the end for anything unusual.',
    },
    {
      path: '/account?tab=general',
      anchor: 'acct-ai',
      feature: 'ai_job_description',
      title: 'AI Business Profile',
      body: 'The services, brands, service area and description here are what the AI writer reads when it turns a rough check-in into a job description for your website. Re-scan my website goes and reads your own site again and refills these fields from it, so you do not have to type them. Anything you correct by hand is what the writer uses, so the more accurate this is, the less editing you do on every job afterwards.',
    },
    {
      path: '/account?tab=general',
      anchor: 'acct-security',
      title: 'Sign-In & Security',
      body: 'This is where you change your sign-in email and password, and add backup addresses. Backup addresses are for recovering the account only. They never sign anyone in, and adding one does not change the address you sign in with.',
      link: { href: '/help/guides/team-roles', label: 'Who else can reach this' },
    },
    {
      path: '/account?tab=billing',
      anchor: 'acct-billing',
      title: 'Billing',
      body: 'This shows your current plan and opens the billing portal, where you change payment details, switch plan or cancel. Only an Owner can reach this tab.',
    },
    {
      path: '/account?tab=connections',
      anchor: 'conn-gbp',
      title: 'Google Business Profile',
      body: 'Connecting your Google listing lets you send a finished job straight to it as a Google post, with the photo and a link back to your work. That post is what puts the work in front of people searching Maps for your area.',
      feature: 'gbp_integration',
    },
    {
      path: '/account?tab=connections',
      anchor: 'conn-review',
      title: 'Google review requests',
      body: 'This stores the link customers use to leave you a Google review. Saving it here is what makes the Request Google Review button on a finished job work.',
    },
    {
      path: '/account?tab=connections',
      anchor: 'conn-gsc',
      title: 'Google Search Console',
      body: 'Connecting Search Console pulls your real impressions and clicks into the Reporting tab, so you can see which published jobs people are finding and what they searched for.',
      feature: 'gsc_integration',
    },
    {
      path: '/account?tab=connections',
      anchor: 'conn-website',
      title: 'Website integration',
      body: 'These are the three ways to put your published jobs on your own site. You only need one at a time, and you met these during setup. Come back here to switch between them or to pick one up later.',
      feature: 'website_integration',
    },
    {
      path: '/account?tab=connections',
      anchor: 'conn-share',
      title: 'Your portfolio link',
      body: 'This gives you one shareable address covering all of your published work, and counts visits so you can tell which places are sending people to it.',
    },
  ],

  [NAV_TIP_CHAPTER]: [
    {
      anchor: 'nav-tutorial',
      title: 'You can come back to this',
      body: 'This walkthrough lives here for good. Open Support Center in the sidebar, choose Interactive Tutorial, then pick the chapter you want and click the link on its right.',
    },
  ],
}

export function hasCoachSteps(chapterId: number): boolean {
  return (COACH_STEPS[chapterId]?.length ?? 0) > 0
}
