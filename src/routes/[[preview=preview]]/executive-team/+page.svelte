<script lang="ts">
  import ContentWidth from "$lib/components/ContentWidth/ContentWidth.svelte";
  import ScreenWidthImage from "$lib/components/ScreenWidth/ScreenWidthImage.svelte";
  import TeamMembers from "$lib/components/TeamMembers/TeamMembers.svelte";

  let { data } = $props();
  let content = $derived(data.page.data);
</script>

<ScreenWidthImage
  darken
  flip
  field={data.page.data.hero_image}
  heightClass="h-[55vh] min-h-[420px]"
  class="flex flex-col items-start justify-end pt-12 pb-25"
>
  <div class="max-w-screen-lg text-white whitespace-pre-line flex flex-col gap-2">
    <p>{content.hero_body}</p>
  </div>
</ScreenWidthImage>
<section class="bg-light pt-14 pb-24">
  <ContentWidth class="text-white mb-10">
    <h2>{content.team_header}</h2>
  </ContentWidth>
  <TeamMembers members={content.team_member} />
</section>
