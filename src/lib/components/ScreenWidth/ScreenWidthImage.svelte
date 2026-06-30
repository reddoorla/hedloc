<script lang="ts">
  import type { ImageField } from "@prismicio/client";
  import placeholder from "../../assets/images/background_placeholder.svg";
  import ContentWidth from "../ContentWidth/ContentWidth.svelte";
  import { PrismicImage } from "@prismicio/svelte";

  let {
    src = placeholder,
    field,
    altText = "background image",
    placeholderSide = "right",
    vimeoId = "",
    darken = false,
    backdrop = false,
    flip = false,
    class: className = "",
    children,
  }: {
    src?: string;
    field: ImageField | null;
    altText?: string;
    placeholderSide?: string;
    vimeoId?: string;
    darken?: boolean;
    backdrop?: boolean;
    flip?: boolean;
    class?: string;
    children?: import("svelte").Snippet;
  } = $props();





  let viewportHeight: number = $state(0);
  let viewportWidth: number = $state(0);
</script>

<svelte:window bind:innerHeight={viewportHeight} bind:innerWidth={viewportWidth} />

<section
  class="h-screen w-screen overflow-clip {backdrop ? 'fixed -z-10 top-0 left-0' : 'relative'}"
>
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-screen aspect-video
		{viewportHeight * 16 > viewportWidth * 9 ? 'h-screen min-w-full' : 'w-screen min-h-full'}"
  >
    {#if !field}
      <img
        {src}
        alt={altText}
        class="absolute bottom-0 {placeholderSide}-0 h-full w-full object-cover -z-10 {src ===
        placeholder
          ? 'lg:w-[45%] md:h-auto'
          : ''}"
      />
    {:else}
      <PrismicImage {field} class="absolute  h-full w-full object-cover -z-10" />
    {/if}

    {#if vimeoId}
      <iframe
        title="background video"
        src={`https://player.vimeo.com/video/${vimeoId}?background=1&muted=1&loop=1&autoplay=1`}
        class="aspect-video absolute {viewportHeight * 16 > viewportWidth * 9
          ? 'h-screen min-w-full'
          : 'w-screen min-h-full'} contrast-[1.15] -z-10"
        frameborder="0"
        allowfullscreen
      ></iframe>
    {/if}

    {#if darken}
      <div
        class="{flip
          ? 'rotate-180'
          : ''} bg-darken-gradient pointer-events-none absolute w-full h-full top-0 left-0 -z-10"
      ></div>
      <div
        class=" {flip
          ? 'rotate-180'
          : ''} bg-darken-gradient-2 pointer-events-none absolute w-full h-full top-0 left-0 -z-10"
      ></div>
    {/if}
  </div>
  <div class="w-screen h-screen absolute top-0 left-0">
    <ContentWidth class="{className || 'flex items-center justify-center'} h-full">
      {@render children?.()}
    </ContentWidth>
  </div>
</section>

<style>
  .bg-darken-gradient {
    background: linear-gradient(180deg, rgba(220, 193, 105, 0.8) 0%, rgba(220, 193, 105, 0) 100%);
  }
  .bg-darken-gradient-2 {
    background: linear-gradient(0deg, #2d2322 0%, rgba(164, 128, 88, 0) 100%);
  }
</style>
