<script lang="ts">
  interface Props {
    type?: 'stat' | 'converter' | 'chart';
  }

  let { type = 'stat' }: Props = $props();
</script>

{#if type === 'stat'}
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-28 rounded-md animate-shimmer"></div>
      <div class="h-6 w-14 rounded-full animate-shimmer"></div>
    </div>
    <div class="h-7 w-36 rounded-lg animate-shimmer mb-2"></div>
    <div class="flex items-center gap-2">
      <div class="h-3 w-20 rounded-md animate-shimmer"></div>
      <div class="h-3 w-16 rounded-md animate-shimmer"></div>
    </div>
  </div>
{:else if type === 'converter'}
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-5">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="h-5 w-44 rounded-md animate-shimmer"></div>
      <div class="h-4 w-24 rounded-md animate-shimmer"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <div class="h-3 w-20 rounded-md animate-shimmer"></div>
        <div class="h-12 w-full rounded-xl animate-shimmer"></div>
      </div>
      <div class="space-y-2">
        <div class="h-3 w-20 rounded-md animate-shimmer"></div>
        <div class="h-12 w-full rounded-xl animate-shimmer"></div>
      </div>
    </div>
    <div class="h-12 w-full rounded-xl animate-shimmer"></div>
  </div>
{:else if type === 'chart'}
  <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
    <div class="flex items-center justify-between">
      <div class="h-5 w-48 rounded-md animate-shimmer"></div>
      <div class="flex gap-2">
        <div class="h-7 w-12 rounded-lg animate-shimmer"></div>
        <div class="h-7 w-12 rounded-lg animate-shimmer"></div>
        <div class="h-7 w-12 rounded-lg animate-shimmer"></div>
      </div>
    </div>
    <div class="h-64 w-full rounded-xl animate-shimmer"></div>
  </div>
{/if}
