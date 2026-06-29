import { useSwipe, type SwipeCustomEvent } from "svelte-gestures";

/**
 * Wraps svelte-gestures v5's `useSwipe` as a Svelte action so call sites can
 * keep the `use:swipe` ergonomics from the v4 API.
 *
 *   const swipe = createSwipeAction((e) => handleSwipe(e));
 *   <div use:swipe>...</div>
 */
export const createSwipeAction = (handler: (e: SwipeCustomEvent) => void) => {
  const gesture = useSwipe(handler, undefined, undefined, true);
  return (node: HTMLElement) => ({ destroy: gesture.swipe(node) });
};

export type { SwipeCustomEvent };
