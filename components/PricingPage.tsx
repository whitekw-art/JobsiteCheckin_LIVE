'use client'

import { useState } from 'react'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'
import '@/styles/pricing.css'

function Ck() {
  return (
    <svg viewBox="0 0 8 8" fill="none">
      <polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel from your account settings, no questions asked. There's no contract, no cancellation fee, and no phone call required. If you cancel, your subscription ends at your next billing date — not immediately.",
  },
  {
    q: 'Can I upgrade or downgrade my plan anytime?',
    a: "Yes. Upgrade anytime and your new features activate immediately. Downgrade takes effect at the start of your next billing cycle. No penalties, no approval process, no phone call required.",
  },
  {
    q: 'What trades does ProjectCheckin work for?',
    a: "Any field service trade where work is done on-site and can be photographed — roofing, HVAC, painting, flooring, landscaping, plumbing, electrical, fencing, remodeling, concrete, windows and doors. If your crew goes to a job site and takes photos, ProjectCheckin works for your business.",
  },
  {
    q: 'How does ProjectCheckin help my contracting business show up on Google?',
    a: "Every job page you publish is a location-specific, indexed web page that tells Google you worked in that neighborhood — the job address, trade type, photos, and description all in one place. Consistent publishing builds your local footprint job by job, without any extra marketing effort from you.",
  },
  {
    q: 'What happens to my job pages if I cancel?',
    a: "Your published pages stay live for 30 days after cancellation. Your photos, job notes, and history are yours — you can export everything before your subscription ends. We don't hold your data hostage.",
  },
  {
    q: 'Is there a setup fee or onboarding cost?',
    a: 'None. No setup fee, no onboarding package, no minimum contract. Create your account, add your business info, and send your crew the check-in link. Your first job can be published the same day.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards — Visa, Mastercard, American Express, and Discover — processed securely through Stripe. Annual billing is available and saves you two months compared to paying monthly.',
  },
  {
    q: 'What does "founding rate" mean?',
    a: "The current prices are 50% off standard rates. The first 20 businesses that subscribe lock them in permanently. When standard pricing launches, founding members never pay more than what they signed up for. The only way to lose your founding rate is to cancel.",
  },
]

const tiers = {
  pro:   { monthly: '$49.50', annual: '$41.25', annualTotal: '$495', annualSave: '$99' },
  elite: { monthly: '$74.50', annual: '$62.08', annualTotal: '$745', annualSave: '$149' },
  titan: { monthly: '$149.50', annual: '$124.58', annualTotal: '$1,495', annualSave: '$299' },
}

export default function PricingPage() {
  const [compareOpen, setCompareOpen] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set([0]))

  const toggleFaq = (i: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <>
      <MarketingNav />
      <div className="pc-pricing">

      {/* HERO */}
      <div className="hero">
        <div className="badge">
          <span className="dot" />
          Founding member pricing — first 20 businesses only
        </div>
        <h1>Clear pricing.<br />No surprises.</h1>
        <p className="hero-trust">No agency. No contract. No SEO knowledge needed.</p>
        <p className="hero-fine">No credit card required &middot; Cancel anytime</p>
      </div>

      {/* BASELINE STRIP */}
      <div className="baseline">
        <div className="baseline-inner">
          <span className="bl-label">Every plan includes:</span>
          {[
            'Mobile check-in — no app download',
            'Unlimited team members',
            'Unlimited check-ins',
            'Every job searchable on Google',
            'Public portfolio page',
            'Export your data anytime',
          ].map(label => (
            <div key={label} className="bl-pill">
              <span className="ck"><Ck /></span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* TIER CARDS + SINGLE CTA */}
      <div className="pricing-wrap">

        {/* BILLING TOGGLE */}
        <div className="billing-toggle">
          <button
            className={`bt-opt${!billingAnnual ? ' active' : ''}`}
            onClick={() => setBillingAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`bt-opt${billingAnnual ? ' active' : ''}`}
            onClick={() => setBillingAnnual(true)}
          >
            Annual
            <span className="bt-save">2 months free</span>
          </button>
        </div>

        <div className="cards">

          {/* FREE */}
          <div className="card">
            <div className="tier-name">Free</div>
            <div className="tier-price">$0<sub>/mo</sub></div>
            <div style={{ height: 18 }} />
            <p className="tier-tagline">Try it on your first 5 jobs. No card, no commitment.</p>
            <div className="pc-feats">
              {['5 published job pages', '5 photos per job', '50 photos per month', 'Owner publish controls', 'Each job page built for Google search', 'Public portfolio page', 'No credit card required'].map(item => (
                <div className="pf" key={item}><span className="pf-ck">&#10003;</span>{item}</div>
              ))}
            </div>
          </div>

          {/* PRO */}
          <div className="card">
            <div className="tier-name">Pro</div>
            <div className="tier-price">{billingAnnual ? tiers.pro.annual : tiers.pro.monthly}<sub>/mo</sub></div>
            <div className="tier-per-biz">per business &middot; unlimited users</div>
            {billingAnnual
              ? <div className="tier-annual-note">billed {tiers.pro.annualTotal}/yr &middot; save {tiers.pro.annualSave}</div>
              : <div className="tier-was">Was $99/mo</div>
            }
            <p className="tier-tagline">Unlimited jobs and Google Business Profile posts.</p>
            <div className="pc-feats">
              <div className="pf-inherit">Everything in Free, plus:</div>
              {['Unlimited published pages', 'Unlimited photos per job', '500 photos per month', 'Google Business Profile post generator', 'Performance dashboard'].map(item => (
                <div className="pf" key={item}><span className="pf-ck">&#10003;</span>{item}</div>
              ))}
            </div>
          </div>

          {/* ELITE — MOST POPULAR */}
          <div className="card popular">
            <div className="pop-badge">Most Popular</div>
            <div className="tier-name">Elite</div>
            <div className="tier-price">{billingAnnual ? tiers.elite.annual : tiers.elite.monthly}<sub>/mo</sub></div>
            <div className="tier-per-biz">per business &middot; unlimited users</div>
            {billingAnnual
              ? <div className="tier-annual-note">billed {tiers.elite.annualTotal}/yr &middot; save {tiers.elite.annualSave}</div>
              : <div className="tier-was">Was $149/mo</div>
            }
            <p className="tier-tagline">Before &amp; after proof that closes quotes and wins jobs.</p>
            <div className="pc-feats">
              <div className="pf-inherit">Everything in Pro, plus:</div>
              {['Before & after photo tagging', 'Ghost camera overlay', '2,000 photos per month', 'Drag-to-reveal widget on job pages'].map(item => (
                <div className="pf" key={item}><span className="pf-ck">&#10003;</span>{item}</div>
              ))}
              <div className="pf"><span className="pf-ck">&#10003;</span>Google Business Profile auto-posts <span className="soon-badge">Soon</span></div>
            </div>
          </div>

          {/* TITAN */}
          <div className="card">
            <div className="tier-name">Titan</div>
            <div className="tier-price">{billingAnnual ? tiers.titan.annual : tiers.titan.monthly}<sub>/mo</sub></div>
            <div className="tier-per-biz">per business &middot; unlimited users</div>
            {billingAnnual
              ? <div className="tier-annual-note">billed {tiers.titan.annualTotal}/yr &middot; save {tiers.titan.annualSave}</div>
              : <div className="tier-was">Was $299/mo</div>
            }
            <p className="tier-tagline">Review requests, unlimited photos, and AI agents that work for you.</p>
            <div className="pc-feats">
              <div className="pf-inherit">Everything in Elite, plus:</div>
              {['One-tap review requests', 'Automated Google review requests', 'Unlimited photos per month', 'Priority support + strategy calls'].map(item => (
                <div className="pf" key={item}><span className="pf-ck">&#10003;</span>{item}</div>
              ))}
              <div className="pf"><span className="pf-ck">&#10003;</span>AI copywriting agent <span className="new-badge">New</span></div>
              <div className="pf"><span className="pf-ck">&#10003;</span>AI review request agent <span className="soon-badge">Soon</span></div>
              <div className="pf"><span className="pf-ck">&#10003;</span>CRM &amp; QuickBooks integration <span className="soon-badge">Soon</span></div>
              <div className="pf"><span className="pf-ck">&#10003;</span>Job widget for any website</div>
              <div className="pf"><span className="pf-ck">&#10003;</span>Branded project page on your own domain, stronger SEO</div>
              <div className="pf"><span className="pf-ck">&#10003;</span>Full WordPress integration, maximum SEO <span className="new-badge">New</span></div>
            </div>
          </div>

        </div>

        {/* SINGLE CTA BLOCK */}
        <div className="cta-block">
          <p className="cta-block-label">Every plan starts with 5 free jobs. Pick your tier during signup — or start free and upgrade anytime.</p>
          <Link href="/auth/register" className="btn-orange">Start Free</Link>
          <p className="cta-block-fine">
            <strong>Cancel anytime.</strong> No contracts. No setup fee. Your data is always yours.
          </p>
        </div>
      </div>

      {/* COMPARE ALL FEATURES */}
      <div className="compare-wrap">
        <button
          className="compare-toggle-btn"
          onClick={() => setCompareOpen(o => !o)}
          aria-expanded={compareOpen}
        >
          {compareOpen ? 'Hide feature comparison' : 'Compare all features'}
          <svg
            className={`toggle-arrow${compareOpen ? ' open' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3,6 8,11 13,6" />
          </svg>
        </button>

        {compareOpen && (
          <div className="compare-table-wrap open">
            <table>
              <thead>
                <tr>
                  <th className="col-feat">Feature</th>
                  <th className="col-t">Free</th>
                  <th className="col-t">Pro</th>
                  <th className="col-t th-elite">Elite</th>
                  <th className="col-t">Titan</th>
                </tr>
              </thead>
              <tbody>

                <tr className="cat"><td colSpan={5}>Job Documentation</td></tr>
                <tr>
                  <td>Photos per job</td>
                  <td><span className="cv">5</span></td>
                  <td><span className="cv">Unlimited</span></td>
                  <td><span className="cv">Unlimited</span></td>
                  <td><span className="cv">Unlimited</span></td>
                </tr>
                <tr>
                  <td>Monthly photo uploads</td>
                  <td><span className="cv">50</span></td>
                  <td><span className="cv">500</span></td>
                  <td><span className="cv">2,000</span></td>
                  <td><span className="cv">No limit</span></td>
                </tr>
                <tr>
                  <td>Before &amp; after photo tagging</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Ghost camera — shoot after photo over the before</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Published Job Pages</td></tr>
                <tr>
                  <td>Published job pages</td>
                  <td><span className="cv">5 total</span></td>
                  <td><span className="cv">Unlimited</span></td>
                  <td><span className="cv">Unlimited</span></td>
                  <td><span className="cv">Unlimited</span></td>
                </tr>
                <tr>
                  <td>Drag-to-reveal before/after widget</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Job widget for any website</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Branded project page on your own domain, stronger SEO</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Full WordPress integration, maximum SEO</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Wix, Squarespace, and other platforms</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Google Business Profile</td></tr>
                <tr>
                  <td>Post generator — formatted and ready to copy</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Auto-posting directly to your profile</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Review Requests</td></tr>
                <tr>
                  <td>One-tap review request — pre-written text or email</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Automated Google review requests</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Job Stats</td></tr>
                <tr>
                  <td>Performance dashboard — views, clicks, engagement</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>Neighborhood-level visibility tracking</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>AI &amp; Automation</td></tr>
                <tr>
                  <td>AI copywriting agent — generates job descriptions from your photos</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="ck">✓</span></td>
                </tr>
                <tr>
                  <td>AI-personalized review request message</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Integrations &amp; API</td></tr>
                <tr>
                  <td>API access</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>
                <tr>
                  <td>QuickBooks &amp; CRM sync</td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cdash">—</span></td>
                  <td><span className="cs">Soon</span></td>
                </tr>

                <tr className="cat"><td colSpan={5}>Support</td></tr>
                <tr>
                  <td>Support</td>
                  <td><span className="cv">Email</span></td>
                  <td><span className="cv">Priority email</span></td>
                  <td><span className="cv">Priority email</span></td>
                  <td><span className="cv">Dedicated</span></td>
                </tr>

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOUNDER STRIP */}
      <div className="founder">
        <div className="founder-inner">
          <p><strong>Built for field crews by someone who grew up in one.</strong> Every job your crew completes deserves to be found. That&apos;s still the whole point.</p>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq">
        <h2>Questions</h2>
        {faqs.map((item, i) => (
          <div key={i} className={`faq-item${openFaqs.has(i) ? ' open' : ''}`}>
            <div className="faq-q" onClick={() => toggleFaq(i)}>
              {item.q}
              <svg className="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="faq-a">{item.a}</div>
          </div>
        ))}
      </section>

      {/* FINAL CTA BAND */}
      <div className="cta-band">
        <h2>Start free.<br />No credit card, no commitment.</h2>
        <p>Five jobs. Zero cost. See if it works for your crew before you spend anything.</p>
        <Link href="/auth/register" className="btn-orange">Get Started Free</Link>
        <div className="fine">No credit card required &middot; Cancel anytime</div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="foot-brand">ProjectCheckin &copy; 2025</div>
        <div className="foot-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
      </div>
    </>
  )
}
