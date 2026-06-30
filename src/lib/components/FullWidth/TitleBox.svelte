<script lang="ts">
    let { icon = placeholderIcon, iconAltText = "logo", labelText = "", titleText = "", subtitleText = "", paragraphText = "", buttonText = "", linkText = "", linkHref = "", backgroundColor = "transparent", float = "center", ...rest, class: className = "" }: { icon?: unknown; iconAltText?: unknown; labelText?: unknown; titleText?: unknown; subtitleText?: unknown; paragraphText?: unknown; buttonText?: unknown; linkText?: unknown; linkHref?: unknown; backgroundColor?: unknown; float?: unknown; [key: string]: unknown; class?: string } = $props();
import placeholderIcon from "../../assets/icons/logos/logo.svg";
  import DefaultButton from "../Buttons/DefaultButton.svelte";
  import ArrowButton from "../Buttons/ArrowButton.svelte";











  let justify = float;
  if (float === "left") justify = "start";
  if (float === "right") justify = "end";

  let horizontalFloatMargin = "mx-auto";
  if (float === "left") horizontalFloatMargin = "ml-0 mr-auto";
  if (float === "right") horizontalFloatMargin = "ml-auto mr-0";

  let _isLinkArrowActive = false;
</script>

<div
  class="w-full flex flex-col p-2 md:p-8 justify-{justify} text-{float} {className || ''}"
  style="background-color: {backgroundColor}"
>
  {#if icon}
    <img src={icon} alt={iconAltText} class="w-[70px] h-[70px] mb-7 {horizontalFloatMargin}" />
  {/if}
  {#if labelText}
    <h6 class="mb-7">{labelText}</h6>
  {/if}
  {#if titleText}
    <h1 class="mb-7">{titleText}</h1>
  {/if}
  {#if subtitleText}
    <h6 class="mb-7">{subtitleText}</h6>
  {/if}
  {#if paragraphText}
    <p class="mb-7 max-w-full">{paragraphText}</p>
  {/if}
  <div class="w-full flex flex-col sm:flex-row align-middle justify-center sm:justify-{justify}">
    {#if buttonText}
      <DefaultButton text={buttonText} class="mr-12" />
    {/if}
    {#if linkText}
      <ArrowButton text={linkText} href={linkHref} class="sm:translate-x-0 ml-4 -translate-x-4" />
    {/if}
  </div>
</div>
