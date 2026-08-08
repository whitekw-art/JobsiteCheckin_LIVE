import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import StripePricingTable from '@/app/pricing/StripePricingTable'
import { TRIAL_OFFERS } from '@/lib/trialOffers'
import '@/styles/subscribe-offer.css'

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string }>
}) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? undefined
  const { offer: offerKey } = await searchParams
  const offer = offerKey ? TRIAL_OFFERS[offerKey] : undefined

  if (offer) {
    const url = email ? `${offer.url}?prefilled_email=${encodeURIComponent(email)}` : offer.url
    return (
      <main className="so-wrap">
        <div className="so-card">
          <div className="so-kicker">Private Trial Offer</div>
          <h1>{offer.label}</h1>
          <p className="so-sub">{offer.sub}</p>
          <a className="so-cta" href={url}>Start My Free Trial &rarr;</a>
          <p className="so-fine">{offer.fine}</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <StripePricingTable email={email} />
    </main>
  )
}
