<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 shadow-2xl backdrop-blur-md space-y-6 ${className}`}>
  <!-- Top decorative accent -->
  <div class="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

  <!-- Header Skeleton -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
    <div class="space-y-2">
      <div class="flex items-center gap-2.5">
        <div class="h-6 w-44 rounded-lg animate-shimmer"></div>
        <div class="h-5 w-20 rounded-full animate-shimmer"></div>
      </div>
      <div class="h-4 w-72 rounded-md animate-shimmer"></div>
    </div>

    <!-- Metric Toggle Pills Skeleton -->
    <div class="flex items-center gap-2 self-start sm:self-auto">
      <div class="h-9 w-32 rounded-xl animate-shimmer"></div>
      <div class="h-9 w-36 rounded-xl animate-shimmer"></div>
    </div>
  </div>

  <!-- Currency Filter Pills Skeleton -->
  <div class="flex items-center gap-2 overflow-x-auto pb-1">
    <div class="h-4 w-20 rounded-md animate-shimmer shrink-0"></div>
    {#each Array(8) as _, i}
      <div class="h-8 w-16 rounded-xl animate-shimmer shrink-0"></div>
    {/each}
  </div>

  <!-- Map Visual Area Skeleton -->
  <div class="relative w-full h-[440px] sm:h-[500px] rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center p-6">
    <!-- Stylized Grid Pattern & Shimmer Map Silhouettes -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0,transparent_70%)] pointer-events-none"></div>
    
    <!-- Shimmering geographic silhouette blocks -->
    <div class="w-full max-w-4xl h-full flex flex-col justify-between py-6 opacity-60">
      <!-- Northern hemisphere silhouettes -->
      <div class="flex justify-around items-center gap-8 px-4">
        <!-- North America -->
        <div class="space-y-2">
          <div class="h-16 w-36 rounded-2xl animate-shimmer transform -rotate-3"></div>
          <div class="h-12 w-28 rounded-xl animate-shimmer ml-4"></div>
        </div>
        <!-- Europe & Northern Asia -->
        <div class="space-y-2">
          <div class="h-14 w-44 rounded-2xl animate-shimmer"></div>
          <div class="h-16 w-60 rounded-2xl animate-shimmer -ml-6"></div>
        </div>
        <!-- East Asia -->
        <div class="space-y-2">
          <div class="h-20 w-32 rounded-2xl animate-shimmer"></div>
        </div>
      </div>

      <!-- Equator & Southern hemisphere silhouettes -->
      <div class="flex justify-around items-center gap-8 px-8">
        <!-- South America -->
        <div class="h-28 w-24 rounded-2xl animate-shimmer transform rotate-6"></div>
        <!-- Africa -->
        <div class="h-32 w-28 rounded-3xl animate-shimmer"></div>
        <!-- Southeast Asia & Australia -->
        <div class="space-y-3">
          <div class="flex gap-2">
            <div class="h-6 w-12 rounded-lg animate-shimmer"></div>
            <div class="h-6 w-16 rounded-lg animate-shimmer"></div>
          </div>
          <div class="h-20 w-32 rounded-2xl animate-shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Center Loading Badge -->
    <div class="absolute z-10 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
      <div class="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      <span class="text-xs font-semibold text-slate-200">Memuat Visualisasi Peta Kurs Dunia...</span>
    </div>
  </div>

  <!-- Bottom Info Cards Skeleton -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
    {#each Array(4) as _, i}
      <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="h-3.5 w-24 rounded-md animate-shimmer"></div>
          <div class="h-5 w-12 rounded-full animate-shimmer"></div>
        </div>
        <div class="h-6 w-32 rounded-lg animate-shimmer"></div>
        <div class="h-3 w-20 rounded-md animate-shimmer"></div>
      </div>
    {/each}
  </div>
</div>
