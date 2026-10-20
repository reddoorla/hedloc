<script lang="ts" module>
  import type { AnimateInOptions } from "$lib/actions/animateIn";

  /** How each member card reveals. A short travel, not animateIn's default
   *  50%: in one column a card is 551-1015px tall, and half of that put its
   *  hidden state below the fold (390x844, 768x1024), so the observer reported
   *  "not in view" and the first card's slot sat empty until the reader
   *  scrolled. app.css hides `[data-reveal="card"]` at this same travel
   *  (src/reveal-hidden-state.test.ts holds them together). */
  export const CARD_REVEAL: AnimateInOptions = { translateY: "24px", failSafe: 2500 };
</script>

<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import Img from "$lib/components/Img.svelte";
  import { PrismicRichText } from "@prismicio/svelte";
  import { fade, prefersReducedMotion } from "$lib/transitions";
  import { animateIn as revealOnScroll } from "$lib/actions/animateIn";
  import { fromAction } from "svelte/attachments";
  import { cappedWidths } from "@reddoorla/maintenance/images";
  import type { AboutDocumentData } from "../../../prismicio-types";

  let {
    members,
    animateIn = false,
  }: {
    members: AboutDocumentData["team_member"];
    /** Reveal each member's photo, name and title on scroll (CARD_REVEAL),
     *  staggered by its position in the row. Per card, not the whole grid: the
     *  grid is 640px+ tall, and its hidden state sat below the fold at
     *  1280x720 and 1440x900. */
    animateIn?: boolean;
  } = $props();

  let viewportWidth = $state(1024);

  let active = $state(-1);
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<ContentWidth class="grid relative lg:min-h-[640px]">
  <div class="[grid-area:1/1] flex flex-col lg:flex-row justify-start relative gap-10">
    <div
      class="lg:absolute lg:top-0 lg:left-0 lg:w-[calc((100%-7.5rem)/4)] lg:pointer-events-none flex flex-col items-start justify-start gap-2 z-30"
      id="team-top"
    >
      {#if active !== -1}
        <button
          transition:fade={{ duration: 150 }}
          onclick={(event) => {
            if (event.detail > 1) return;
            active = -1;
          }}
          class="hidden lg:flex flex-col items-start justify-start gap-2 text-left pointer-events-auto"
        >
          <Img
            class="w-full aspect-[3/4] object-cover mb-4"
            field={members[active].headshot}
            widths={cappedWidths(members[active].headshot)}
            sizes="(min-width: 1024px) 25vw, 100vw"
            loading="lazy"
          />
          <h3 class="h4">{members[active].name}</h3>
          <p class="h5">{members[active].title}</p>

          <div
            class="mt-8 button-text bump w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >
            Close
          </div>
        </button>
      {/if}
    </div>
    {#each members as _p, i (i)}
      <button
        onclick={(event) => {
          if (event.detail > 1) return;
          if (active === i) {
            active = -1;
          } else {
            active = i;
            if (viewportWidth < 1024) {
              document.getElementById("team-top")?.scrollIntoView({
                behavior: prefersReducedMotion() ? "auto" : "smooth",
                block: "start",
              });
            }
          }
        }}
        class="lg:w-[calc((100%-7.5rem)/4)] members flex flex-col items-start justify-start gap-2 text-left {active !==
        -1
          ? 'pointer-events-none'
          : ''}"
      >
        <!-- The reveal moves this wrapper, not the button: the button stretches
             to the row's 640px, so 50% of it would hide the card below the
             fold. Same flex column as the button, so nothing moves. -->
        <span
          class="w-full flex flex-col items-start justify-start gap-2"
          data-reveal={animateIn ? "card" : undefined}
          {@attach animateIn ? fromAction(revealOnScroll, () => CARD_REVEAL) : undefined}
        >
          <Img
            class="w-full aspect-[3/4] object-cover mb-4"
            field={members[i].headshot}
            widths={cappedWidths(members[i].headshot)}
            sizes="(min-width: 1024px) 25vw, 100vw"
            loading="lazy"
          />
          <h3 class="h4">{members[i].name}</h3>
          <p class="h5">{members[i].title}</p>
        </span>
      </button>
    {/each}
  </div>
  <div
    data-testid="team-bio"
    class="[grid-area:1/1] bg-light flex flex-col justify-start items-end z-20 pointer-events-none transition-opacity duration-150 {active ===
    -1
      ? 'opacity-0'
      : ''}"
  >
    {#if active > -1}
      <div class="  lg:w-2/3" in:fade={{ duration: 150, delay: 150 }} out:fade={{ duration: 150 }}>
        <button
          transition:fade={{ duration: 150 }}
          onclick={() => (active = -1)}
          class="flex lg:hidden flex-col items-start justify-start gap-2 text-left"
        >
          <Img
            class="w-full aspect-[3/4] object-cover"
            field={members[active].headshot || ""}
            widths={cappedWidths(members[active].headshot)}
            sizes="100vw"
            loading="lazy"
          />
          <h3 class="h4">{members[active].name}</h3>
          <p class="h5">{members[active].title}</p>
        </button>
        <div class="lg:mt-8">
          <PrismicRichText field={members[active].body || ""} />
        </div>
        <button
          onclick={() => {
            document.getElementsByClassName("members")[active].scrollIntoView({
              behavior: prefersReducedMotion() ? "auto" : "smooth",
              block: "start",
            });
            active = -1;
          }}
          class=" lg:hidden pointer-events-auto mt-8 button-text bump w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >Close</button
        >
      </div>
    {/if}
  </div>
</ContentWidth>
