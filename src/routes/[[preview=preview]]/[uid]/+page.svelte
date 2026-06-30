<script>
  import { SliceZone } from "@prismicio/svelte";

  import { components } from "$lib/slices";

  let { data, ...rest } = $props();
</script>

<SliceZone slices={data.page.data.slices} {components} />
