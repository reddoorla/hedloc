<script>
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { cappedWidths } from "@reddoorla/maintenance/images";

  let { data } = $props();
  let content = $derived(data.page.data);

  let viewportWidth = $state(1024);
</script>

<svelte:window bind:innerWidth={viewportWidth} />

{#snippet ctaButtons()}
  <div class="flex flex-row gap-6 text-white">
    <a
      href="/executive-team"
      class="button-text transition w-36 h-9 border-2 border-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
      >Executive Team</a
    >
    <a
      href="/contact"
      class="button-text transition w-36 h-9 border-2 text-dark bg-white border-white hover:bg-dark active:bg-white active:text-dark hover:text-white flex items-center justify-center"
      >Contact Us</a
    >
  </div>
{/snippet}

<ScreenWidthImage
  darken
  field={data.page.data.hero_image}
  class="flex flex-col items-start justify-end py-16 md:py-24 lg:pb-25"
>
  <div
    class="max-w-screen-lg text-white whitespace-pre-line flex flex-col gap-6 [&_a]:underline [&_a:hover]:opacity-80"
  >
    <PrismicRichText field={content.hero_body} />
    {#if viewportWidth > 1024}
      <PrismicRichText field={content.subbody} />
    {/if}
  </div>
  {#if viewportWidth > 1024}
    <div class="mt-25">
      {@render ctaButtons()}
    </div>
  {/if}
</ScreenWidthImage>

<section>
  {#if viewportWidth <= 1024}
    <ContentWidth class="flex flex-col items-start text-white pt-12 gap-10">
      <div class="whitespace-pre-line flex flex-col gap-2 [&_a]:underline [&_a:hover]:opacity-80">
        <PrismicRichText field={content.subbody} />
      </div>
      {@render ctaButtons()}
    </ContentWidth>
  {/if}
  {#if viewportWidth > 1024}
    <div class="flex flex-row text-white relative h-[800px]">
      <div
        class="w-1/3 h-full flex flex-col justify-start items-start pr-10 relative"
        style="padding-left:{viewportWidth < 1560 ? '4vw' : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <PrismicImage
          field={content.vertical_image}
          class="w-full h-full object-cover"
          widths={cappedWidths(content.vertical_image)}
          sizes="(min-width: 1024px) 33vw, 100vw"
          loading="lazy"
        />
      </div>
      <div
        class="w-2/3 flex flex-col relative"
        style="padding-right:{viewportWidth < 1560 ? '4vw' : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <div class="w-full h-1/2 flex flex-row gap-10 pb-5">
          <PrismicImage
            field={content.nine_by_4_small}
            class="w-2/3 aspect-[16/9] object-cover"
            widths={cappedWidths(content.nine_by_4_small)}
            sizes="(min-width: 1024px) 44vw, 100vw"
            loading="lazy"
          />
          <PrismicImage
            field={content.four_by_three}
            class="w-1/3 object-cover"
            widths={cappedWidths(content.four_by_three)}
            sizes="(min-width: 1024px) 22vw, 100vw"
            loading="lazy"
          />
        </div>
        <div class="w-full h-1/2 flex flex-row pt-5">
          <PrismicImage
            field={content.nine_by_four_large}
            class="w-full h-full object-cover"
            widths={cappedWidths(content.nine_by_four_large)}
            sizes="(min-width: 1024px) 66vw, 100vw"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  {:else}
    <ContentWidth class="gap-10 flex flex-col items-center justify-center my-10">
      <PrismicImage
        field={content.nine_by_4_small}
        widths={cappedWidths(content.nine_by_4_small)}
        sizes="92vw"
        loading="lazy"
      />
      <PrismicImage
        field={content.four_by_three}
        widths={cappedWidths(content.four_by_three)}
        sizes="92vw"
        loading="lazy"
      />
      <PrismicImage
        field={content.nine_by_four_large}
        widths={cappedWidths(content.nine_by_four_large)}
        sizes="92vw"
        loading="lazy"
      />
    </ContentWidth>
  {/if}
</section>
