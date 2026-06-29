<script>
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";

  let { data } = $props();
  let content = $state(data.page.data);

  let viewportWidth = $state(1024);
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<ScreenWidthImage
  darken
  field={data.page.data.hero_image}
  class="flex flex-col items-start justify-end py-16 md:py-24 gap-6"
>
  <h1 class="text-white max-w-screen-md">{content.headline || ""}</h1>
  <div
    class="max-w-screen-md text-white whitespace-pre-line flex flex-col gap-2"
  >
    <PrismicRichText field={content.hero_body} />
  </div>
</ScreenWidthImage>

<section>
  <div class="flex flex-col lg:flex-row text-white pt-10">
    {#if viewportWidth > 1024}
      <div
        class="w-1/3 flex flex-col justify-start items-start pr-10"
        style="padding-left:{viewportWidth < 1560
          ? '4vw'
          : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <h2>{content.subheading}</h2>
        <div class="flex flex-row gap-6 mt-14">
          <a
            href="/about"
            class="button-text transition w-36 h-9 border-2 border-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
            >About Us</a
          >
          <a
            href="/about#contact"
            class="button-text transition w-36 h-9 border-2 text-dark bg-white border-white hover:bg-dark active:bg-white active:text-dark hover:text-white flex items-center justify-center"
            >Contact Us</a
          >
        </div>
      </div>
      <div
        class="w-2/3"
        style="padding-right:{viewportWidth < 1560
          ? '4vw'
          : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <PrismicRichText field={content.subbody} />
      </div>
    {:else}
      <ContentWidth class="flex flex-col items-start justify-start gap-6">
        <h2 class="text-left">{content.subheading}</h2>
        <PrismicRichText field={content.subbody} />
      </ContentWidth>
    {/if}
  </div>
  {#if viewportWidth > 1024}
    <div class="flex flex-row text-white pt-10 relative h-[800px]">
      <div
        class="w-1/3 h-full flex flex-col justify-start items-start pr-10 relative"
        style="padding-left:{viewportWidth < 1560
          ? '4vw'
          : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <PrismicImage
          field={content.vertical_image}
          class="w-full h-full object-cover"
        />
      </div>
      <div
        class="w-2/3 flex flex-col relative"
        style="padding-right:{viewportWidth < 1560
          ? '4vw'
          : 'calc( (100vw - 1440px) / 2 )'}"
      >
        <div class="w-full h-1/2 flex flex-row gap-10 pb-5">
          <PrismicImage
            field={content.nine_by_4_small}
            class="w-2/3 aspect-[16/9] object-cover"
          />
          <PrismicImage
            field={content.four_by_three}
            class="w-1/3 object-cover"
          />
        </div>
        <div class="w-full h-1/2 flex flex-row pt-5">
          <PrismicImage
            field={content.nine_by_four_large}
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  {:else}
    <ContentWidth
      class="gap-10 flex flex-col items-center justify-center my-10"
    >
      <PrismicImage field={content.nine_by_4_small} />
      <PrismicImage field={content.four_by_three} />
      <PrismicImage field={content.nine_by_four_large} />
    </ContentWidth>
  {/if}
</section>
