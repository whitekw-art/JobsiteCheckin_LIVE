export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 space-y-4 text-center">
        <h1 className="text-3xl font-bold text-green-700">Payment Complete</h1>
        <p className="text-gray-600">Thanks for subscribing! We’re getting your workspace ready.</p>
        <p className="text-sm text-gray-500">
          You’ll be redirected shortly. If nothing happens, click the button below.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
