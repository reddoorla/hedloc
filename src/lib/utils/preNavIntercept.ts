// Kit 2 exports the type from @sveltejs/kit (reddoor-starter, on Kit 3, has it
// from $app/navigation).
import type { BeforeNavigate } from "@sveltejs/kit";

/**
 * Structural subset of SvelteKit's `BeforeNavigate` — enough for the
 * intercept decision, and cheap for tests to fabricate. A real
 * `BeforeNavigate` is assignable to it.
 */
export interface NavigationLike {
  type: BeforeNavigate["type"];
  willUnload: boolean;
  from: { url: URL } | null;
  to: { url: URL; route: { id: string | null } } | null;
}

export interface PreNavState {
  /** href of a navigation the caller already deferred and re-issued. Only
   *  reddoor-starter's PreNavTransition (not ported here) passes it;
   *  TransitionOverlay never does. */
  pendingHref?: string | undefined;
  /** When true, never intercept — no overlay and no artificial delay. */
  reducedMotion?: boolean;
}

/**
 * Decides whether a navigation gets a transition: here, whether
 * TransitionOverlay raises its wash (upstream in reddoor-starter it also
 * decides whether PreNavTransition cancels and re-issues the navigation, which
 * is where the `goto` and `cancel()` clauses below come from). Everything the
 * browser (or SvelteKit) handles better on its own is let through untouched:
 *
 * - reduced motion: the fade is pure decoration, so the delay goes too.
 * - popstate: cancelling back/forward and re-issuing via `goto` would push a
 *   NEW history entry, trapping the user ahead of a growing stack — the back
 *   button must stay native.
 * - unloading navigations: cancel() there triggers the browser's
 *   "leave site?" dialog.
 * - external / unmatched URLs (no route id): full page load, nothing to fade.
 * - same-pathname navs (hash links, query-only changes): no page change to
 *   mask.
 * - our own deferred goto arriving at its target: intercepting again would
 *   loop forever.
 */
export function shouldIntercept(nav: NavigationLike, state: PreNavState = {}): boolean {
  if (state.reducedMotion) return false;
  if (nav.willUnload || nav.type === "popstate") return false;
  if (!nav.to?.route.id) return false;
  if (nav.from && nav.to.url.pathname === nav.from.url.pathname) return false;
  if (state.pendingHref === nav.to.url.href) return false;
  return true;
}
