<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { fade } from "svelte/transition";
  import { cappedWidths } from "@reddoorla/maintenance/images";
  import type { AboutDocumentData } from "../../../prismicio-types";

  let { members }: { members: AboutDocumentData["team_member"] } = $props();

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
          <PrismicImage
            class="w-full aspect-[3/4] object-cover"
            field={members[active].headshot}
            widths={cappedWidths(members[active].headshot)}
            sizes="(min-width: 1024px) 25vw, 100vw"
            loading="lazy"
          />
          <h4>{members[active].name}</h4>
          <h5>{members[active].title}</h5>

          <div
            class="mt-8 button-text transition w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >
            Close
          </div>
        </button>
      {/if}
    </div>
    {#each members as _p, i (i)}
      <button
        onclick={() => {
          if (active === i) {
            active = -1;
          } else {
            active = i;
            if (viewportWidth < 1024) {
              document
                .getElementById("team-top")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }}
        class="lg:w-[calc((100%-7.5rem)/4)] members flex flex-col items-start justify-start gap-2 text-left {active !==
        -1
          ? 'pointer-events-none'
          : ''}"
      >
        <PrismicImage
          class="w-full aspect-[3/4] object-cover mb-4"
          field={members[i].headshot}
          widths={cappedWidths(members[i].headshot)}
          sizes="(min-width: 1024px) 25vw, 100vw"
          loading="lazy"
        />
        <h4>{members[i].name}</h4>
        <h5>{members[i].title}</h5>
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
          <PrismicImage
            class="w-full aspect-[3/4] object-cover"
            field={members[active].headshot || ""}
            widths={cappedWidths(members[active].headshot)}
            sizes="100vw"
            loading="lazy"
          />
          <h4>{members[active].name}</h4>
          <h5>{members[active].title}</h5>
        </button>
        <div class="lg:mt-8">
          <PrismicRichText field={members[active].body || ""} />
        </div>
        <button
          onclick={() => {
            document
              .getElementsByClassName("members")
              [active].scrollIntoView({ behavior: "smooth", block: "start" });
            active = -1;
          }}
          class=" lg:hidden pointer-events-auto mt-8 button-text transition w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >Close</button
        >
      </div>
    {/if}
  </div>
</ContentWidth>
