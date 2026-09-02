<script lang="ts">
  interface Props {
    rows?: number;
    columns?: number;
  }

  let { rows = 5, columns = 6 }: Props = $props();
</script>

<div class="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
  <!-- Table Header Skeleton -->
  <div class="border-b border-slate-800/80 bg-slate-950/60 px-6 py-4">
    <div class="flex items-center justify-between gap-4">
      <div class="h-5 w-40 rounded-lg animate-shimmer"></div>
      <div class="flex items-center gap-2">
        <div class="h-8 w-24 rounded-lg animate-shimmer"></div>
        <div class="h-8 w-20 rounded-lg animate-shimmer"></div>
      </div>
    </div>
  </div>

  <!-- Table Body Skeleton -->
  <div class="divide-y divide-slate-800/50 p-2">
    {#each Array(rows) as _, i}
      <div class="flex items-center justify-between px-4 py-4.5">
        <!-- Provider Info Column -->
        <div class="flex items-center gap-3.5 w-1/4">
          <div class="h-10 w-10 shrink-0 rounded-xl animate-shimmer"></div>
          <div class="space-y-2 flex-1">
            <div class="h-4 w-28 rounded-md animate-shimmer"></div>
            <div class="h-3 w-16 rounded-md animate-shimmer"></div>
          </div>
        </div>

        <!-- Buy Rate Column -->
        <div class="space-y-1.5 w-1/6 text-right">
          <div class="h-4 w-24 ml-auto rounded-md animate-shimmer"></div>
          <div class="h-3 w-12 ml-auto rounded-md animate-shimmer"></div>
        </div>

        <!-- Sell Rate Column -->
        <div class="space-y-1.5 w-1/6 text-right">
          <div class="h-4 w-24 ml-auto rounded-md animate-shimmer"></div>
          <div class="h-3 w-12 ml-auto rounded-md animate-shimmer"></div>
        </div>

        <!-- Spread Column -->
        <div class="space-y-1.5 w-1/6 text-right">
          <div class="h-4 w-16 ml-auto rounded-md animate-shimmer"></div>
          <div class="h-3 w-10 ml-auto rounded-md animate-shimmer"></div>
        </div>

        <!-- Status / Badge Column -->
        <div class="w-1/6 flex justify-end">
          <div class="h-6 w-20 rounded-full animate-shimmer"></div>
        </div>
      </div>
    {/each}
  </div>
</div>
