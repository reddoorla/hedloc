<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import type { RichTextField } from "@prismicio/client";
  import TeamMembers from "$lib/components/TeamMembers/TeamMembers.svelte";
  import type { AboutDocumentData } from "../../../prismicio-types";

  const filler =
    "Years of operating leadership across energy, chemicals and industrial technology, with plants, people and budgets in several countries at once. ";

  function paragraph(lead: string, length: number) {
    let text = lead;
    while (text.length < length) text += filler;
    return { type: "paragraph" as const, text: text.slice(0, length).trimEnd(), spans: [] };
  }

  function bio(label: string, lengths: number[]): RichTextField {
    const [first, ...rest] = lengths.map((length, n) =>
      paragraph(n === 0 ? `${label} bio. ` : `${label} paragraph ${n + 1}. `, length),
    );
    return [first, ...rest];
  }

  const headshot = (alt: string) => ({
    id: alt,
    url: new URL("/web-app-manifest-512x512.png", page.url).href,
    alt,
    copyright: null,
    dimensions: { width: 512, height: 512 },
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  });

  const members: AboutDocumentData["team_member"] = [
    {
      name: "Member One",
      title: "Partner",
      headshot: headshot("Member One"),
      body: bio("Member One", [482, 522, 107]),
    },
    {
      name: "Member Two",
      title: "Partner",
      headshot: headshot("Member Two"),
      body: bio("Member Two", [883]),
    },
    {
      name: "Member Three",
      title: "President",
      headshot: headshot("Member Three"),
      body: bio("Member Three", [898]),
    },
    {
      name: "Member Four Longer Placeholder",
      title: "Advisor",
      headshot: headshot("Member Four Longer Placeholder"),
      body: bio("Member Four Longer Placeholder", [113, 642, 675, 98, 339]),
    },
  ];

  let hydrated = $state(false);
  onMount(() => (hydrated = true));
</script>

<svelte:head>
  <title>Executive Team fixture — Reddoor</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="bg-light pt-32 pb-24" data-testid="team-section" data-hydrated={hydrated}>
  <TeamMembers {members} />
</section>
