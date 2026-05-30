import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://174c800828e826d3e26bf4f409779e8f@o4511469400031232.ingest.us.sentry.io/4511469432471552",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,

  beforeSend(event) {
    // PostHog fetch failures are caused by ad blockers — not app errors
    const msg = event.exception?.values?.[0]?.value ?? ''
    if (msg.includes('posthog')) return null
    return event
  },
});
