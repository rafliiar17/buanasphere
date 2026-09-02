<script lang="ts">
  interface Props {
    rows?: number;
  }
  let { rows = 5 }: Props = $props();
</script>

<div style="border:1px solid var(--bg-rule);border-radius:var(--radius);overflow:hidden;">
  <!-- Header shimmer -->
  <div style="border-bottom:2px solid var(--ink);padding:10px 12px;display:flex;gap:48px;">
    {#each [120, 60, 90, 90, 70, 50] as w}
      <div style="height:10px;width:{w}px;border-radius:2px;" class="animate-shimmer"></div>
    {/each}
  </div>
  <!-- Row shimmers -->
  {#each Array(rows) as _, i}
    <div style="display:flex;align-items:center;gap:48px;padding:12px;border-bottom:1px solid var(--bg-rule);">
      <div style="display:flex;flex-direction:column;gap:5px;width:120px;">
        <div style="height:12px;width:100px;border-radius:2px;" class="animate-shimmer"></div>
        <div style="height:9px;width:65px;border-radius:2px;" class="animate-shimmer"></div>
      </div>
      <div style="height:10px;width:60px;border-radius:2px;" class="animate-shimmer"></div>
      <div style="height:13px;width:90px;border-radius:2px;margin-left:auto;" class="animate-shimmer"></div>
      <div style="height:13px;width:90px;border-radius:2px;" class="animate-shimmer"></div>
      <div style="height:12px;width:70px;border-radius:2px;" class="animate-shimmer"></div>
      <div style="height:10px;width:50px;border-radius:2px;" class="animate-shimmer"></div>
    </div>
  {/each}
</div>

