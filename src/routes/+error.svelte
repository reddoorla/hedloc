<script>
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>{page.status} — Reddoor</title>
</svelte:head>

<!-- High-contrast surface so 404/500 pages pass axe color-contrast on the dark
     site body, and a real <title> satisfies the document-title rule. -->
<main style="background-color: #ffffff; color: #1a1a1a; min-height: 100vh; padding: 3rem 1.5rem;">
  <h1>{page.status}</h1>
  <p>{page.error?.message ?? "Something went wrong."}</p>
  <a href="/">Back to home</a>
</main>
