<script lang="ts">
  import Select from "svelte-select";
  import dropdownArrow from "$lib/assets/icons/dropdown-arrow-light.svg";

  let {
    value = $bindable(""),
    placeholder = "",
    class: className = "",
    items,
  }: {
    value?: string;
    placeholder?: string;
    class?: string;
    items: string[] | { label: string; value: string }[];
  } = $props();

  // svelte-select 6 narrowed the `items` prop type to `SelectItem[] | null`,
  // where `SelectItem = Record<string, unknown>` — it no longer ADMITS a plain
  // `string[]` in its types. It still accepts one at RUNTIME: v6's
  // `convertStringItemsToObjects` (Select.svelte:271-279) maps each string to
  // `{ index, value, label }` exactly as v5 did. So this is an under-declared
  // type, not a dropped feature, and the fix belongs at the boundary rather
  // than in the data.
  //
  // Normalising here instead would mean reproducing that conversion, `index`
  // included, and `index` is read by the library's own hover/active-item
  // tracking — a near-copy that drifts is worse than a cast that does not.
  const selectItems = $derived(items as unknown as Record<string, unknown>[]);

  let selectHover = $state(false);
</script>

<div
  class="max-w-[720px] w-full mx-auto cursor-pointer relative {className || ''}"
  role="separator"
  onmouseover={() => (selectHover = true)}
  onfocus={() => (selectHover = true)}
  onmouseout={() => (selectHover = false)}
  onblur={() => (selectHover = false)}
>
  <Select items={selectItems} bind:value {placeholder} searchable={false} class="svelte-select" />
  <div
    class="absolute h-full aspect-square right-0 top-0 flex items-center justify-center pointer-events-none"
  >
    <img
      src={dropdownArrow}
      alt="decorative dropdown arrow"
      aria-hidden
      class:opacity-55={selectHover}
      class=" transition-all pointer-events-none"
    />
  </div>
</div>
