<script lang="ts">
    let { value = "", placeholder = "", ...rest, class: className = "" }: { value?: unknown; placeholder?: unknown; [key: string]: unknown; class?: string } = $props();
import Select from "svelte-select";
  import dropdownArrow from "$lib/assets/icons/dropdown-arrow-light.svg";

  export let items: string[] | { label: string; value: string }[];


  let selectHover = false;
</script>

<div
  class="max-w-[720px] w-full mx-auto cursor-pointer relative {className || ''}"
  role="separator"
  onmouseover={() => (selectHover = true)}
  onfocus={() => (selectHover = true)}
  onmouseout={() => (selectHover = false)}
  onblur={() => (selectHover = false)}
>
  <Select {items} bind:value {placeholder} searchable={false} class="svelte-select" />
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
