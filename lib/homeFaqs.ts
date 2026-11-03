// FAQ shown on the homepage. Also used to build the homepage FAQPage
// structured data in app/page.tsx, so the two always match.
export interface FaqItem { q: string; a: string }

export const faqs: FaqItem[] = [
  {
    q: 'Does my crew need to download an app?',
    a: 'No download required. Your crew opens a link in a mobile browser, takes photos, adds a description, and submits. Most people are running in under two minutes.',
  },
  {
    q: 'How does the GBP posting work?',
    a: "Publish a job and it's on your Google Business Profile — images, content, and backlinks from real jobs straight to your site and GBP, all handled for you. This is the leveling up that separates you from your competitors. You decide how much say you want. Approve each one from your dashboard, or turn it on once and stop thinking about your Google presence entirely. Most owners start with approvals for a week, see what gets posted, then leave it alone. Either way, your profile keeps showing work from this month instead of work from two years ago — without anyone on your team spending a minute on it.",
  },
  {
    q: 'What trades does this work for?',
    a: 'Any field service business where the work is done on-site and can be photographed. Roofing, flooring, painting, HVAC, landscaping, plumbing, electrical, remodeling — if your crew goes to a job site, it works.',
  },
  {
    q: "What's the difference between a project page and my portfolio?",
    a: "Every job gets its own project page — a standalone before/after link you can send in a quote. Your portfolio is the full library of all published jobs as a public-facing showcase.",
  },
  {
    q: 'How is this different from posting on Google myself?',
    a: "Posting yourself means gathering photos, writing copy, logging in, and doing it after every job. Most businesses try for two weeks and stop. ProjectCheckin makes it one step your crew handles at the job site — so it happens every job, without you thinking about it.",
  },
  {
    q: 'Is there a contract or commitment?',
    a: "There is no contract and no commitment. Cancel anytime from your account settings. You keep every project page and portfolio entry you've published — they stay live as long as you're a subscriber.",
  },
  {
    q: "My crew isn't tech-savvy. Will they actually use this?",
    a: "Your crew doesn't need to download an app or create an account. You send your crew a link — they open it in their phone browser, take photos, add a quick note, and hit submit. Most crews are doing it on their first job. If they can text, they can do this.",
  },
  {
    q: 'How long does it take to get set up?',
    a: 'Under 10 minutes. Create your account, add your business info, and send your crew the check-in link. Your first job can be published the same day.',
  },
  {
    q: 'How do I get more Google reviews from customers?',
    a: "The biggest reason most businesses don't get reviews is they never ask — or they ask too late. ProjectCheckin sends a personalized review request to your customer automatically after each job is published, while the work is still fresh. Text or email, one tap, pre-written. Most businesses see more review conversations in their first month than they did all year.",
  },
  {
    q: 'How do I get my service business to show up on Google?',
    a: 'Google ranks local businesses that are active, documented, and reviewed. Every job you publish through ProjectCheckin creates a location-specific page Google can index, a Google Business Profile post showing recent activity, and a review request to your customer. Do that consistently and your Google presence builds with every job your crew completes.',
  },
]
