<script lang="ts">
  import placeholderIcon from "../../assets/icons/logos/logo.svg";
  import DefaultButton from "../Buttons/DefaultButton.svelte";
  import ArrowButton from "../Buttons/ArrowButton.svelte";

  let {
    icon = placeholderIcon,
    iconAltText = "logo",
    labelText = "",
    titleText = "",
    subtitleText = "",
    paragraphText = "",
    buttonText = "",
    linkText = "",
    linkHref = "",
    backgroundColor = "transparent",
    float = "center",
    class: className = ""
  }: {
    icon?: string;
    iconAltText?: string;
    labelText?: string;
    titleText?: string;
    subtitleText?: string;
    paragraphText?: string;
    buttonText?: string;
    linkText?: string;
    linkHref?: string;
    backgroundColor?: string;
    float?: string;
    class?: string;
  } = $props();











  let justify = $derived.by(() => {
    let value = float;
    if (float === "left") value = "start";
    if (float === "right") value = "end";
    return value;
  });

  let horizontalFloatMargin = $derived.by(() => {
    let value = "mx-auto";
    if (float === "left") value = "ml-0 mr-auto";
    if (float === "right") value = "ml-auto mr-0";
    return value;
  });

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
