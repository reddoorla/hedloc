<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { fade } from "svelte/transition";

  let { data } = $props();
  let content = $derived(data.page.data);

  let viewportWidth = $state(1024);

  let active = $state(-1);
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<ScreenWidthImage
  darken
  flip
  field={data.page.data.hero_image}
  class="flex flex-col items-start justify-end py-36 gap-6"
>
  <h1 class="text-white max-w-screen-lg">{content.hero_header || ""}</h1>
  <div class="max-w-screen-lg text-white whitespace-pre-line flex flex-col gap-2">
    <p>{content.hero_body}</p>
  </div>
</ScreenWidthImage>
<section class="bg-light py-24">
  <ContentWidth class="text-white mb-10">
    <h2>{content.team_header}</h2>
  </ContentWidth>
  <ContentWidth class="flex flex-col lg:flex-row justify-start relative lg:h-[640px] gap-10">
    <div class="lg:w-1/4 flex flex-col items-start justify-start gap-2 z-30" id="team-top">
      {#if active !== -1}
        <button
          transition:fade={{ duration: 150 }}
          onclick={() => (active = -1)}
          class="hidden lg:flex flex-col items-start justify-start gap-2"
        >
          <PrismicImage
            class="w-full aspect-[3/4] object-cover"
            field={content.team_member[active].headshot}
          />
          <h4>{content.team_member[active].name}</h4>
          <h5>{content.team_member[active].title}</h5>

          <div
            class="mt-8 button-text transition w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >
            Close
          </div>
        </button>
      {/if}
    </div>
    {#each content.team_member as _p, i (i)}
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
        class="lg:w-1/4 members flex flex-col items-start justify-start gap-2 {active !== -1
          ? 'pointer-events-none'
          : ''}"
      >
        <PrismicImage
          class="w-full aspect-[3/4] object-cover mb-4"
          field={content.team_member[i].headshot}
        />
        <h4>{content.team_member[i].name}</h4>
        <h5>{content.team_member[i].title}</h5>
      </button>
    {/each}
    <div
      class="w-full h-full absolute bg-light flex flex-col justify-start items-end z-20 pointer-events-none transition-opacity duration-150 {active ===
      -1
        ? 'opacity-0'
        : ''}"
    >
      {#if active > -1}
        <div
          class="  lg:w-2/3"
          in:fade={{ duration: 150, delay: 150 }}
          out:fade={{ duration: 150 }}
        >
          <button
            transition:fade={{ duration: 150 }}
            onclick={() => (active = -1)}
            class="flex lg:hidden flex-col items-start justify-start gap-2"
          >
            <PrismicImage
              class="w-full aspect-[3/4] object-cover"
              field={content.team_member[active].headshot || ""}
            />
            <h4>{content.team_member[active].name}</h4>
            <h5>{content.team_member[active].title}</h5>
          </button>
          <div class="lg:mt-8">
            <PrismicRichText field={content.team_member[active].body || ""} />
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
</section>
