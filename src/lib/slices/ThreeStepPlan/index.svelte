<script>
    let { slice, ...rest } = $props();
/** @type {import("@prismicio/client").Content.ThreeStepPlanSlice} */
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
  Placeholder component for {slice.slice_type} (variation: {slice.variation}) Slices
</section>
