<script lang="ts">
  let {
    icon = "",
    iconAltText = "company logo",
    testimonialText = "",
    attribution = "",
    attributionLabel = "",
    backgroundColor = "transparent",
    float = "center",
    class: className = ""
  }: {
    icon?: string;
    iconAltText?: string;
    testimonialText?: string;
    attribution?: string;
    attributionLabel?: string;
    backgroundColor?: string;
    float?: string;
    class?: string;
  } = $props();

  let justify = $derived.by(() => {
    if (float === "left") return "start";
    if (float === "right") return "end";
    return float;
  });

  let horizontalFloatMargin = $derived.by(() => {
    if (float === "left") return "ml-0 mr-auto";
    if (float === "right") return "ml-auto mr-0";
    return "mx-auto";
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
