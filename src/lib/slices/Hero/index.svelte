<script>
  /** @type {{ slice: import("@prismicio/client").Content.HeroSlice }} */
  let { slice } = $props();
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
  Placeholder component for {slice.slice_type} (variation: {slice.variation}) Slices
</section>
