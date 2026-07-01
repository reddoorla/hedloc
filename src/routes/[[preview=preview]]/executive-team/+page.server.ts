import { createClient } from "$lib/prismicio";

export async function load({ fetch, cookies }) {
  const client = createClient({ fetch, cookies });

  const page = await client.getSingle("about");

  return {
    page,
    title: "Hedloc | Executive Team",
    meta_description: page.data.meta_description,
    meta_title: page.data.meta_title,
    meta_image: page.data.meta_image.url,
  };
}

export function entries() {
  return [{}];
}
