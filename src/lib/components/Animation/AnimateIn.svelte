<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
    let { style = "", transitionDelayMax = 400, transitionDuration = 2400, ...rest }: { style?: unknown; transitionDelayMax?: unknown; transitionDuration?: unknown; [key: string]: unknown } = $props();
import { onDestroy, onMount } from "svelte";

  let isInView = false;
  let el: HTMLElement | null;
  let transitionDelay = 0;


  const checkViewport = () => {
    if (window && el) {
      let rect = el.getBoundingClientRect();
      isInView = rect.bottom <= window.innerHeight + rect.height;
      transitionDelay = transitionDelayMax * (rect.left / window.innerWidth);
    }
  };
  let checking: ReturnType<typeof setInterval>;

  onMount(() => {
    checkViewport();

    checking = setInterval(() => {
      checkViewport();
    }, 4000);

    window.addEventListener("scroll", checkViewport);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", checkViewport);

      if (checking) clearInterval(checking);
    }
  });
</script>

<div
  bind:this={el}
  class="transition ease-fast-slow {isInView
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-[50%]'}"
  style="transition-delay:{transitionDelay}ms; transition-duration:{transitionDuration}ms; {style}"
>
  <slot />
</div>
