'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RegistrationType = 'individual' | 'business'

interface RegistrationFormState {
  registrationType: RegistrationType
  firstName: string
  lastName: string
  industry: string
  title: string
  phone: string
  website: string
  email: string
  heardAboutUs: string
  username: string
  password: string
  companyName: string
  street: string
  city: string
  state: string
  zip: string
  fax: string
}

const initialFormState: RegistrationFormState = {
  registrationType: 'individual',
  firstName: '',
  lastName: '',
  industry: '',
  title: '',
  phone: '',
  website: '',
  email: '',
  heardAboutUs: '',
  username: '',
  password: '',
  companyName: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  fax: '',
}

const INDIVIDUAL_PRICE_DOLLARS = 199
const BUSINESS_PRICE_DOLLARS = 299

export default function RegisterPage() {
  const router = useRouter()
  const [registerForm, setRegisterForm] = useState(initialFormState)
  const [isRegistering, setIsRegistering] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    const len = digits.length

    if (len === 0) return ''
    if (len < 4) return `(${digits}`
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handleRegistrationTypeChange = (type: RegistrationType) => {
    setFeedback(null)
    setRegisterForm((prev) => ({
      ...prev,
      registrationType: type,
      ...(type === 'individual'
        ? {
            companyName: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            fax: '',
          }
        : {}),
    }))
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    const {
      registrationType,
      firstName,
      lastName,
      industry,
      title,
      phone,
      website,
      email,
      heardAboutUs,
      username,
      password,
      companyName,
      street,
      city,
      state,
      zip,
      fax,
    } = registerForm

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedPhone = phone.trim()
    const trimmedWebsite = website.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedIndustry = industry.trim()
    const trimmedTitle = title.trim()
    const trimmedHeard = heardAboutUs.trim()
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()
    const trimmedCompanyName = companyName.trim()
    const trimmedStreet = street.trim()
    const trimmedCity = city.trim()
    const trimmedState = state.trim()
    const trimmedZip = zip.trim()
    const trimmedFax = fax.trim()

    if (!trimmedFirst || !trimmedLast || !trimmedPhone || !normalizedEmail || !trimmedUsername || !trimmedPassword) {
      setFeedback({ type: 'error', text: 'First name, last name, phone, email, username, and password are required.' })
      return
    }

    if (trimmedPassword.length < 8) {
      setFeedback({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    if (
      registrationType === 'business' &&
      (!trimmedCompanyName || !trimmedStreet || !trimmedCity || !trimmedState || !trimmedZip)
    ) {
      setFeedback({ type: 'error', text: 'Business registrations require company name and full address.' })
      return
    }

    const payload = {
      registrationType,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      industry: trimmedIndustry,
      title: trimmedTitle,
      phone: trimmedPhone,
      website: trimmedWebsite,
      email: normalizedEmail,
      heardAboutUs: trimmedHeard,
      username: trimmedUsername,
      password: trimmedPassword,
      companyName: trimmedCompanyName,
      street: trimmedStreet,
      city: trimmedCity,
      state: trimmedState,
      zip: trimmedZip,
      fax: trimmedFax,
    }

    setIsRegistering(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Registration failed. Please try again.')
      }

      setFeedback({ type: 'success', text: 'Registration complete! Redirecting to payment...' })
      setRegisterForm((prev) => ({ ...initialFormState, registrationType: prev.registrationType }))

      const sessionResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: normalizedEmail,
          amount:
            registerForm.registrationType === 'business'
              ? BUSINESS_PRICE_DOLLARS
              : INDIVIDUAL_PRICE_DOLLARS,
          currency: 'usd',
          metadata: {
            registrationType,
            firstName: trimmedFirst,
            lastName: trimmedLast,
            phone: trimmedPhone,
          },
        }),
      })

      const sessionData = await sessionResponse.json().catch(() => null)

      if (!sessionResponse.ok || !sessionData?.url) {
        throw new Error(sessionData?.error || 'Failed to create checkout session')
      }

      window.location.href = sessionData.url
      return
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Registration failed. Please try again.' })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Create Your Account</h1>
          <p className="text-center text-gray-600 mt-2">
            Provide your details below, then continue to payment to finish onboarding.
          </p>

          <form onSubmit={handleRegister} className="space-y-4 mt-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Register as</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRegistrationTypeChange('individual')}
                  className={`py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                    registerForm.registrationType === 'individual'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => handleRegistrationTypeChange('business')}
                  className={`py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                    registerForm.registrationType === 'business'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                  }`}
                >
                  Business
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name*
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name*
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  value={registerForm.industry}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Residential HVAC"
                />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title / Role
                </label>
                <input
                  id="title"
                  type="text"
                  value={registerForm.title}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Operations Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Phone Number*
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={registerForm.phone}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      phone: formatPhoneNumber(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="name@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="heard" className="block text-sm font-medium text-gray-700 mb-1">
                How did you hear about us?
              </label>
              <input
                id="heard"
                type="text"
                value={registerForm.heardAboutUs}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, heardAboutUs: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus(border-transparent"
                placeholder="Referral, Google, etc."
              />
            </div>

            <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username*
                </label>
                <input
                  id="username"
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mycompany.admin"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password*
                </label>
                <input
                  id="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus(border-transparent"
                  placeholder="Create a secure password"
                  required
                />
              </div>
            </div>

            {registerForm.registrationType === 'business' && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Business Details</h3>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={registerForm.website}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label htmlFor="register-company-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name*
                  </label>
                  <input
                    id="register-company-name"
                    type="text"
                    value={registerForm.companyName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ACME Construction"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street*
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={registerForm.street}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, street: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City*
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Charlotte"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State*
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={registerForm.state}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="NC"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP*
                    </label>
                    <input
                      id="zip"
                      type="text"
                      inputMode="numeric"
                      value={registerForm.zip}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, zip: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="28202"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="fax" className="block text-sm font-medium text-gray-700 mb-1">
                    Fax
                  </label>
                  <input
                    id="fax"
                    type="text"
                    value={registerForm.fax}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        fax: formatPhoneNumber(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRegistering ? 'Submitting...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="inline-block py-2 text-blue-600 font-medium hover:underline min-h-[44px]">
                Sign in
              </Link>
            </p>
          </div>

          {feedback && (
            <div
              className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
