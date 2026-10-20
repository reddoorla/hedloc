<script lang="ts">
  import { animateIn } from "$lib/actions/animateIn";

  let {
    animateIn: reveal = false,
    class: className = "",
    children,
  }: {
    /** Reveal the block on scroll into view (`use:animateIn`, 2400ms, staggered by position). */
    animateIn?: boolean;
    class?: string;
    children?: import("svelte").Snippet;
  } = $props();
</script>

{#if reveal}
  <div
    use:animateIn
    class="max-w-[1220px] xl:max-w-[1440px] xl:mx-auto mx-[4%] w-[92%] {className ||
      'flex flex-col items-center justify-center relative'}"
  >
    {@render children?.()}
  </div>
{:else}
  <div
    class="max-w-[1220px] xl:max-w-[1440px] xl:mx-auto mx-[4%] w-[92%] {className ||
      'flex flex-col items-center justify-center relative'}"
  >
    {@render children?.()}
  </div>
{/if}
