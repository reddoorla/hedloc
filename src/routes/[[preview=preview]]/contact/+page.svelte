<script lang="ts">
  import { enhance } from "$app/forms";
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";

  // `data` carries the Prismic hero + a per-request `formTs` for the bot timing
  // screen; `form` is the ingest action result ({ success } | { error }).
  let { data, form } = $props();

  let submitting = $state(false);
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
    {#if form?.success}
      <p role="status" class="w-full border border-gold rounded-xs p-6 text-white">
        Thanks — your message is on its way. We'll be in touch soon.
      </p>
    {:else}
      <!--
        Posts to the central reddoor fleet ingest via createIngestAction (see
        +page.server.ts); the recipient is configured per-site in Airtable and the
        email is sent by the dashboard's Resend integration. Spam is screened by
        the hidden honeypot + a fill-timing token — no Netlify Forms / CAPTCHA.
      -->
      <form
        class="w-full flex flex-col text-white gap-8 lg:gap-10"
        method="POST"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update();
            submitting = false;
          };
        }}
      >
        {#if form?.error}
          <p role="alert" class="w-full border border-red-500 rounded-xs p-4 text-red-400">
            {form.error}
          </p>
        {/if}

        <!-- Anti-bot: per-request timing token + a hidden honeypot. -->
        <input type="hidden" name="ts" value={data.formTs} />
        <input
          type="text"
          name="bot-field"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
          class="hidden"
        />

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
            type="submit"
            disabled={submitting}
            class="mt-8 button-text transition w-36 h-9 border border-white text-white hover:bg-white active:bg-dark active:text-white hover:text-dark flex items-center justify-center disabled:opacity-60"
            >{submitting ? "Sending…" : "Submit"}</button
          >
        </div>
      </form>
    {/if}
  </ContentWidth>
</section>
