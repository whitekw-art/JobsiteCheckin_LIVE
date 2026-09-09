'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Loads Storyblok's visual-editor bridge so the preview iframe stays in sync
 * with the editor: clicking an element on the page selects its block, and
 * saving in the editor refreshes the page.
 *
 * TEST ONLY — rendered by /blog-preview/[slug]. Loads nothing unless the page
 * is actually inside the Storyblok editor (checked via the `_storyblok` query
 * parameter Storyblok appends), so it costs a normal visitor nothing.
 */

type StoryblokBridgeInstance = {
  on: (events: string[], cb: () => void) => void
}

declare global {
  interface Window {
    StoryblokBridge?: new (options?: Record<string, unknown>) => StoryblokBridgeInstance
  }
}

const BRIDGE_SRC = 'https://app.storyblok.com/f/storyblok-v2-latest.js'

export default function StoryblokBridge() {
  const router = useRouter()

  useEffect(() => {
    // Storyblok appends `_storyblok` to the preview URL, but that parameter can
    // be lost on client-side navigation, so also treat "rendered inside an
    // iframe" as being in the editor. A normal visitor is neither.
    const hasParam = new URLSearchParams(window.location.search).has('_storyblok')
    const inIframe = window.self !== window.top
    if (!hasParam && !inIframe) return

    const start = () => {
      if (!window.StoryblokBridge) return
      const bridge = new window.StoryblokBridge()
      // `input` fires on every keystroke in the editor; `published`/`change`
      // fire on save. Refreshing the server component is what re-renders the
      // page with the new content.
      bridge.on(['input', 'published', 'change'], () => router.refresh())
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${BRIDGE_SRC}"]`)
    if (existing) {
      start()
      return
    }

    const script = document.createElement('script')
    script.src = BRIDGE_SRC
    script.async = true
    script.onload = start
    document.body.appendChild(script)
  }, [router])

  return null
}
