<script lang="ts">






    let { icon = "", iconAltText = "company logo", testimonialText = "", attribution = "", attributionLabel = "", backgroundColor = "transparent", float = "center", ...rest, class: className = "" }: { icon?: unknown; iconAltText?: unknown; testimonialText?: unknown; attribution?: unknown; attributionLabel?: unknown; backgroundColor?: unknown; float?: unknown; [key: string]: unknown; class?: string } = $props();
let justify: string;
  let horizontalFloatMargin: string;

  // @migration-task: $effect won't trigger UI updates on plain `let` bindings — refine mutated locals to $state or split into per-variable $derived.
  $effect(() => {
    justify = float;
    if (float === "left") justify = "start";
    if (float === "right") justify = "end";

    horizontalFloatMargin = "mx-auto";
    if (float === "left") horizontalFloatMargin = "ml-0 mr-auto";
    if (float === "right") horizontalFloatMargin = "ml-auto mr-0";
  });
</script>

<div
  class="{className || ''} w-full flex flex-col p-2 sm:p-8 justify-{justify} text-{float}"
  style="background-color: {backgroundColor}"
>
  {#if icon}
    <img src={icon} alt={iconAltText} class="pl-3 mb-12 {horizontalFloatMargin}" />
  {/if}

  {#if testimonialText}
    <p class="mb-7 max-w-full">{testimonialText}</p>
  {/if}

  {#if attribution}
    <p class="mb-3 max-w-full">{attribution}</p>
  {/if}

  {#if attributionLabel}
    <p class="mb-7 max-w-full text-xs">{attributionLabel}</p>
  {/if}
</div>
