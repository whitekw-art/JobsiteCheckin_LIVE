import Link from 'next/link'
import { redirect } from 'next/navigation'

interface CheckoutPageProps {
  searchParams: Promise<{
    email?: string
  }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const stripeCheckoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL
  const params = await searchParams
  const email = params.email

  if (stripeCheckoutUrl) {
    try {
      const checkoutUrl = new URL(stripeCheckoutUrl)
      if (email && !checkoutUrl.searchParams.has('prefilled_email')) {
        checkoutUrl.searchParams.set('prefilled_email', email)
      }
      redirect(checkoutUrl.toString())
    } catch (error) {
      console.error('Invalid NEXT_PUBLIC_STRIPE_CHECKOUT_URL', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">Complete Your Subscription</h1>
          <p className="text-center text-gray-600 mt-2">
            Finish payment through Stripe to unlock the Jobsite Check-In dashboard.
          </p>
        </div>

        {email && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold">Account Email</p>
            <p>{email}</p>
          </div>
        )}

        {stripeCheckoutUrl ? (
          <a
            href={stripeCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700"
          >
            Open Stripe Checkout
          </a>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-900">
            <p className="font-semibold">Checkout link not configured</p>
            <p>Add NEXT_PUBLIC_STRIPE_CHECKOUT_URL to your environment to point to your Stripe payment link.</p>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            After paying, you will be redirected by Stripe. If you return manually, sign in with the email and password you chose.
          </p>
          <p>
            Need help? Email support or contact your admin to verify the payment.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/auth/signin"
            className="text-center w-full border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Already paid? Sign In
          </Link>
          <Link
            href="/auth/register"
            className="text-center w-full border border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Need to update your registration details?
          </Link>
        </div>
      </div>
    </div>
  )
}
