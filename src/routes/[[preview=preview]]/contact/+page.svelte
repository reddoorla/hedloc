<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";

  let { data } = $props();

  let form: HTMLFormElement | undefined = $state();
  // requestSubmit() runs HTML5 constraint validation (so the required fields are
  // enforced) before posting to Netlify; plain .submit() would skip validation.
  let submit = () => {
    if (form) form.requestSubmit();
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
<section class="bg-dark py-24" id="contact">
  <ContentWidth>
    <form
      class="w-full flex flex-col text-white gap-8 lg:gap-10"
      name="contact"
      method="post"
      bind:this={form}
      netlify
      netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="contact" />

      <div class="w-full flex flex-col lg:flex-row lg:items-center">
        <label for="name" class="text-gold lg:w-1/12">Name*</label>
        <input
          id="name"
          class="lg:w-11/12 border-[0.5px] rounded-xs normal-case text-white border-gold bg-transparent h-12 px-6"
          name="name"
          type="text"
          placeholder="First and Last Name"
          required
        />
      </div>

      <div class="w-full flex flex-col lg:flex-row lg:items-center justify-start">
        <label for="email" class="text-gold lg:w-1/12">Email*</label>
        <input
          id="email"
          class="lg:w-4/12 border-[0.5px] rounded-xs normal-case text-white border-gold bg-transparent h-12 px-6"
          name="email"
          type="email"
          placeholder="Email Address"
          required
        />
        <div class="w-0 h-8 lg:h-0 lg:w-1/6"></div>
        <label for="phone" class="text-gold lg:w-1/12">Phone*</label>
        <input
          id="phone"
          class="lg:w-4/12 border-[0.5px] rounded-xs normal-case text-white border-gold bg-transparent h-12 px-6"
          name="phone"
          type="tel"
          placeholder="(000)-000-0000"
          required
        />
      </div>

      <div class="w-full flex flex-col lg:flex-row">
        <label for="message" class="text-gold lg:w-1/12">Message*</label>
        <textarea
          id="message"
          class="lg:w-11/12 border-[0.5px] rounded-xs normal-case text-white border-gold bg-transparent h-56 px-6 pt-2"
          name="message"
          placeholder="Write your message."
          required></textarea>
      </div>

      <div class="w-full flex justify-end">
        <button
          type="button"
          onclick={submit}
          class="mt-8 button-text transition w-36 h-9 border border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center"
          >Submit</button
        >
      </div>
    </form>
  </ContentWidth>
</section>
