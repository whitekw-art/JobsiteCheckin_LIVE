/**
 * The two iMessage conversation-thread visuals on the AI Review Request Agent
 * feature page — a short hero preview and an extended thread in the "when
 * customers write back" section. COPIES of markup currently inline in
 * components/AIReviewRequestAgent.tsx, deliberately duplicated so the live
 * feature page stays untouched — see the note in
 * components/landing/BentoVisuals.tsx for why. TEST ONLY.
 */

export function ReviewAgentImessageShort() {
  return (
    <div className="imsg-wrap">
      <div className="imsg-header">
        <div className="imsg-avatar">MP</div>
        <div className="imsg-contact-name">Mike Peterson</div>
        <div className="imsg-contact-sub">Text Message · 147 Clearwater Dr</div>
      </div>
      <div className="imsg-body">
        <div className="imsg-event-bar">
          <span className="imsg-event-dot" />
          Job published — AI agent activated
        </div>
        <div className="imsg-row out">
          <div className="imsg-row-wrap">
            <div className="imsg-sender-label">Your AI agent sent</div>
            <div className="imsg-bubble out">
              <strong>Mike</strong> — really appreciated the trust you put in us for the roof at
              Clearwater. Hope you love the result. If you have a moment: [review link]
              <br />
              <br />
              — Ridgeline Roofing
            </div>
          </div>
        </div>
        <div className="imsg-row in">
          <div className="imsg-row-wrap">
            <div className="imsg-bubble in">Do you warranty this work?</div>
          </div>
        </div>
        <div className="imsg-row out">
          <div className="imsg-row-wrap">
            <div className="imsg-bubble out">
              Yes — 2-year labor warranty. Your Clearwater project is fully covered.
            </div>
          </div>
        </div>
        <div className="imsg-agent-typing">
          <div className="imsg-agent-typing-label">Customer Service Agent is typing…</div>
          <div className="imsg-agent-typing-bub">
            <span className="imsg-t-dot" />
            <span className="imsg-t-dot" />
            <span className="imsg-t-dot" />
          </div>
        </div>
      </div>
      <div className="imsg-note">
        <span className="imsg-note-icon">⚑</span>
        Complaints escalate to you immediately — your AI agent pauses and waits
      </div>
    </div>
  )
}

export function ReviewAgentImessageExtended() {
  return (
    <div className="imsg-wrap">
      <div className="imsg-header">
        <div className="imsg-avatar">MP</div>
        <div className="imsg-contact-name">Mike Peterson</div>
        <div className="imsg-contact-sub">Text Message · 147 Clearwater Dr</div>
      </div>
      <div className="imsg-body">
        <div className="imsg-event-bar">
          <span className="imsg-event-dot" />
          Job published — your AI agent handles the conversation
        </div>
        <div className="imsg-row out">
          <div className="imsg-row-wrap">
            <div className="imsg-sender-label">Your AI agent sent</div>
            <div className="imsg-bubble out">
              <strong>Mike</strong> — really appreciated the trust you put in us for the roof at
              Clearwater. Hope you love the result. A Google review goes a long way for us:
              [review link]
              <br />
              <br />
              — Ridgeline Roofing
            </div>
          </div>
        </div>
        <div className="imsg-row in">
          <div className="imsg-row-wrap">
            <div className="imsg-bubble in">
              Looks great. Do you warranty this work? Want to make sure I&apos;m covered if
              anything comes up.
            </div>
          </div>
        </div>
        <div className="imsg-row out">
          <div className="imsg-row-wrap">
            <div className="imsg-sender-label">Your AI agent sent</div>
            <div className="imsg-bubble out">
              Yes — Ridgeline Roofing offers a 2-year labor warranty on all work. Your Clearwater
              project is fully covered. Any issue, just call us and we&apos;ll make it right.
            </div>
          </div>
        </div>
        <div className="imsg-row in">
          <div className="imsg-row-wrap">
            <div className="imsg-bubble in">Perfect. I&apos;ll go leave that review right now.</div>
          </div>
        </div>
        <div className="imsg-row out">
          <div className="imsg-row-wrap">
            <div className="imsg-bubble out">
              That means a lot — thank you, Mike. It was a pleasure working with you.
            </div>
            <div className="imsg-read">Read</div>
          </div>
        </div>
        <div className="imsg-agent-typing">
          <div className="imsg-agent-typing-label">Customer Service Agent is typing…</div>
          <div className="imsg-agent-typing-bub">
            <span className="imsg-t-dot" />
            <span className="imsg-t-dot" />
            <span className="imsg-t-dot" />
          </div>
        </div>
      </div>
      <div className="imsg-note">
        <span className="imsg-note-icon">⚑</span>
        Complaints or disputes are flagged to you immediately — your AI agent pauses and waits for
        your response
      </div>
    </div>
  )
}
