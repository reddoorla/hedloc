<script lang="ts">
  // Progressive-loading wrapper around PrismicImage: the image renders blurred
  // (`.progressive-img` in app.css) and sharpens once the underlying <img>
  // finishes — or fails — loading. Ported from reddoor-starter's Img.svelte,
  // which wraps @zerodevx/svelte-img; this site's images are Prismic fields.
  import { PrismicImage } from "@prismicio/svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof PrismicImage> & {
    /** Blur the image until it loads. Off for an image the reader has just
     *  seen sharp elsewhere on the page (the team's open card), where a second
     *  blur-up only reads as lag. */
    blurUp?: boolean;
  };

  let { class: passedClasses = "", blurUp = true, ...rest }: Props = $props();

  let loaded = $state(false);

  // PrismicImage spreads its other props onto the <img>, which carries this
  // attachment through to the element without a wrapper.
  //
  // An image can be `complete` before this attaches listeners (cache hit, or a
  // pre-hydration failure). `complete` is terminal either way: the load OR
  // error event already fired and will never refire, so listening now would
  // leave the blur stuck forever. naturalWidth doesn't matter — a failed image
  // (complete, naturalWidth === 0) is just as done as a decoded one, and we
  // unblur on error anyway (see the error listener below).
  function track(el: HTMLImageElement) {
    if (el.complete) {
      loaded = true;
      return;
    }
    const onDone = () => (loaded = true);
    el.addEventListener("load", onDone);
    el.addEventListener("error", onDone);
    return () => {
      el.removeEventListener("load", onDone);
      el.removeEventListener("error", onDone);
    };
  }
</script>

{#if blurUp}
  <PrismicImage
    {...rest}
    class={`progressive-img${loaded ? " progressive-img--loaded" : ""}${passedClasses ? " " + passedClasses : ""}`}
    {@attach track}
  />
{:else}
  <PrismicImage {...rest} class={passedClasses} />
{/if}
