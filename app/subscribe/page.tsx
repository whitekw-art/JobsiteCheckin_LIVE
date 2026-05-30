import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import StripePricingTable from '@/app/pricing/StripePricingTable'

export default async function SubscribePage() {
  const session = await getServerSession(authOptions)
  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <StripePricingTable email={session?.user?.email ?? undefined} />
    </main>
  )
}
