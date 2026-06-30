<script lang="ts">
    let { animateIn = false, ...rest, class: className = "" }: { animateIn?: unknown; [key: string]: unknown; class?: string } = $props();
import AnimateIn from "../Animation/AnimateIn.svelte";
</script>

{#if animateIn}
  <AnimateIn
    ><div
      class="max-w-[1220px] xl:max-w-[1440px] xl:mx-auto mx-[4%] w-[92%] {className ||
        'flex flex-col items-center justify-center relative'}"
    >
      <slot />
    </div></AnimateIn
  >
{:else}
  <div
    class="max-w-[1220px] xl:max-w-[1440px] xl:mx-auto mx-[4%] w-[92%] {className ||
      'flex flex-col items-center justify-center relative'}"
  >
    <slot />
  </div>
{/if}
