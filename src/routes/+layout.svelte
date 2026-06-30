<script lang="ts">
  import { PrismicPreview } from "@prismicio/svelte/kit";
  import { page } from "$app/stores";
  import { repositoryName } from "$lib/prismicio";
  import logo from "$lib/assets/icons/logos/logoFull.svg";
  import logoSmall from "$lib/assets/icons/logos/logo.svg";
  import "../app.css";
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */

  let viewportWidth = $state(1024);

  let { children } = $props();
</script>

<svelte:head>
  <title>{$page.data.title}</title>
  {#if $page.data.meta_description}
    <meta name="description" content={$page.data.meta_description} />
  {/if}
  {#if $page.data.meta_title}
    <meta name="og:title" content={$page.data.meta_title} />
  {/if}
  {#if $page.data.meta_image}
    <meta name="og:image" content={$page.data.meta_image.url} />
    <meta name="twitter:card" content="summary_large_image" />
  {/if}
  <meta name="viewport" content="width=device-width, initial-scale=1.0 user-scalable=no" />
</svelte:head>
<svelte:window bind:innerWidth={viewportWidth} />
<main class="overflow-hidden">
  <header class="absolute top-0 left-0 w-screen h-24 z-20">
    <ContentWidth class="h-full flex flex-row justify-between items-center">
      <a href="/" class="bump"
        ><img
          src={viewportWidth > 768 ? logo : logoSmall}
          class="h-5 hover:opacity-80 transition-opacity"
          alt="hedloc investment co"
        /></a
      >
      <div class="flex flex-row text-white gap-6 uppercase">
        <a href="/about" class="hover:opacity-80 transition-opacity">About</a>
        <a href="/about#contact" class="hover:opacity-80 transition-opacity">Contact Us</a>
      </div>
    </ContentWidth>
  </header>
  {@render children?.()}

  <footer class="md:h-72 py-12 text-white">
    <ContentWidth class="flex flex-row justify-start">
      <a href="/" class="bump"
        ><img
          src={viewportWidth > 768 ? logo : logoSmall}
          class="h-5 hover:opacity-80 transition-opacity"
          alt="hedloc investment co"
        /></a
      >
    </ContentWidth>
    <ContentWidth class="h-full flex flex-col md:flex-row justify-between items-start mt-12">
      <div class="flex flex-col md:flex-row justify-start gap-16">
        <div>
          223 West Wall Street, Suite 300 <br /> Midland, TX 79701 <br /> <br /> P.O. Box 882 | Midland,
          TX 79702
        </div>
        <div>
          P: 432.253.7808 <br /> F: 432.253.7840
        </div>
      </div>
      <div class="flex flex-col gap-3 mt-16 md:mt-0">
        <a href="/" class="hover:opacity-80 transition-opacity">Home</a>
        <a href="/about" class="hover:opacity-80 transition-opacity">About</a>
        <a href="/about#contact" class="hover:opacity-80 transition-opacity">Contact Us</a>
      </div>
    </ContentWidth>
  </footer>
</main>
<!-- Only mount the Prismic preview toolbar on server-rendered preview routes
     (/preview/*). On public, prerendered pages the toolbar's iframe sets 21
     third-party cookies (io.prismic.previewSession), which tanks the Lighthouse
     best-practices score to ~0.78 and is a privacy concern for every visitor.
     The Prismic dashboard preview flow redirects through /api/preview to a
     /preview/* URL, so editors still get the toolbar where it matters. -->
{#if $page.params.preview === "preview"}
  <PrismicPreview {repositoryName} />
{/if}
