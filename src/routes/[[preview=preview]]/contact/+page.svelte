<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";

  let { data } = $props();

  let form: HTMLFormElement | undefined = $state();
  let submit = () => {
    if (form) form.submit();
  };
</script>

<ScreenWidthImage
  darken
  flip
  field={data.page.data.hero_image}
  class="flex flex-col items-start justify-end py-36 gap-6"
>
  <h1 class="text-white max-w-screen-lg">Contact Us</h1>
</ScreenWidthImage>
<section class="bg-[#cac2b3] py-24" id="contact">
  <ContentWidth>
    <form
      class="w-full flex flex-col bg-primary text-white gap-8 lg:gap-10 p-4 lg:p-10"
      name="contact"
      method="post"
      bind:this={form}
      netlify
      netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="contact" />

      <div class="w-full flex flex-col lg:flex-row">
        <div class="lg:w-1/12">Name</div>
        <input
          class="lg:w-11/12 border-[1px] rounded-[3px] text-dark border-light h-10 pl-6"
          name="name"
          type="text"
        />
      </div>

      <div class="w-full flex flex-col lg:flex-row justify-start">
        <div class="lg:w-1/12">Email</div>
        <input
          class="lg:w-4/12 border-[1px] rounded-[3px] text-dark border-light h-10 pl-6"
          name="email"
          type="text"
        />
        <div class="w-0 h-8 lg:h-0 lg:w-1/6"></div>
        <div class="lg:w-1/12">Phone</div>
        <input
          class="lg:w-4/12 border-[1px] rounded-[3px] text-dark border-light h-10 pl-6"
          name="phone"
          type="text"
        />
      </div>

      <div class="w-full flex flex-col lg:flex-row">
        <div class="lg:w-1/12">Message</div>
        <textarea
          class="lg:w-11/12 border-[1px] rounded-[3px] text-dark border-light h-48 pl-6 pt-2"
          name="message"></textarea>
      </div>
      <div class="ml-auto mr-20 w-16">
        <button
          onclick={submit}
          class="mt-8 button-text transition w-36 h-9 border-2 border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >Submit</button
        >
      </div>
    </form>
  </ContentWidth>
</section>
