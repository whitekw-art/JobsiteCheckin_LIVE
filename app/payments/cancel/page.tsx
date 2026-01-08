export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="text-gray-600">
          Your checkout wasn’t completed. You can resume registration or return to your dashboard.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
