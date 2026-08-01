import { env } from "$env/dynamic/private";
import { isFilled, NotFoundError } from "@prismicio/client";
import { createIngestAction } from "@reddoorla/maintenance/forms";
import { createClient } from "$lib/prismicio";

import type { Actions, PageServerLoad } from "./$types";

// The root layout sets `prerender = "auto"`; a form `action` cannot run on a
// prerendered route ("Cannot prerender pages with actions"). Opt out — this
// route is genuinely dynamic now that it posts to the fleet ingest.
export const prerender = false;

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const client = createClient({ fetch, cookies });

  // This page reads its own `contact` single (customtypes/contact) so the hero
  // and copy are editable independently of `about`, which it used to borrow
  // them from.
  //
  // EVERY Contact field is optional and falls back FIELD BY FIELD to the
  // content this page shipped with — an editor filling in only the hero image
  // never blanks the headline or drops the page's metadata. About is that
  // fallback source (it is what this route rendered before), so both singles
  // are fetched in parallel. A missing document on either side degrades instead
  // of throwing: `getSingle` 404s while a document is unpublished, and only
  // NotFoundError is swallowed — every other Prismic failure still surfaces.
  const notFoundToNull = (label: string) => (err: unknown) => {
    if (!(err instanceof NotFoundError)) throw err;
    console.warn(`[contact] no published "${label}" document in Prismic — falling back`);
    return null;
  };

  const [contact, about] = await Promise.all([
    client.getSingle("contact").catch(notFoundToNull("contact")),
    client.getSingle("about").catch(notFoundToNull("about")),
  ]);

  const c = contact?.data;
  const a = about?.data;

  return {
    // The document actually driving the page (unused by the template today,
    // kept for parity with the other routes and for a future slice zone).
    page: contact ?? about,
    hero: {
      // Headline/body have no About equivalent worth inheriting — About's are
      // the Executive Team's — so unfilled keeps the copy this page has always
      // rendered: the hardcoded headline and no body paragraph.
      header: c?.hero_header || "Contact Us",
      body: c?.hero_body || "",
      image: c && isFilled.image(c.hero_image) ? c.hero_image : (a?.hero_image ?? null),
    },
    title: "Hedloc | Contact",
    meta_description:
      c && isFilled.keyText(c.meta_description)
        ? c.meta_description
        : (a?.meta_description ?? null),
    meta_title: c && isFilled.keyText(c.meta_title) ? c.meta_title : (a?.meta_title ?? null),
    meta_image: c && isFilled.image(c.meta_image) ? c.meta_image.url : (a?.meta_image?.url ?? null),
    // Plant a per-request timestamp for the bot timing screen.
    formTs: Date.now(),
  };
};

// Mirrors the reddoor fleet: forward the contact form to the central dashboard
// ingest (which persists the lead and emails the site's Airtable-configured
// recipient via Resend). Honeypot + fill-timing screening is handled inside
// createIngestAction. Requires FORMS_INGEST_URL + FORMS_INGEST_TOKEN in the env.
export const actions: Actions = {
  default: createIngestAction({
    formType: "contact",
    getConfig: () => ({
      url: env.FORMS_INGEST_URL,
      token: env.FORMS_INGEST_TOKEN,
    }),
    buildPayload: (form, event) => ({
      name: form.get("name")?.toString(),
      email: form.get("email")?.toString(),
      phone: form.get("phone")?.toString(),
      message: form.get("message")?.toString(),
      // Full URL incl. query string so UTM/campaign params (?utm_source=…) are captured.
      sourceUrl: event.url.href,
      // Synthetic end-to-end probe marker (the fleet `form-e2e` audit). Forwarded
      // ONLY when the submitted form carries testMode=true — a real visitor never
      // sets it. Rides through as an extraField (no schema change); central ingest
      // recognizes it and routes the submission away from every real sink.
      testMode: form.get("testMode")?.toString() === "true" || undefined,
    }),
  }),
};
