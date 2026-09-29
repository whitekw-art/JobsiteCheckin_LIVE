/**
 * Lets the walkthrough open the Support Center group in the sidebar.
 *
 * The group is collapsed by default on the dashboard, so the Interactive
 * Tutorial link the tip points at is not in the DOM when a first run starts.
 * The two sidebars are in separate React trees (the dashboard carries its own,
 * predating DashboardShell), so a window event is the least invasive way to
 * reach both.
 */
export const REVEAL_SUPPORT_NAV = 'pc-reveal-support-nav'

export function revealSupportNav() {
  window.dispatchEvent(new Event(REVEAL_SUPPORT_NAV))
}
