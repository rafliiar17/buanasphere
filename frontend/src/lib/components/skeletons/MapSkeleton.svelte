<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-4 sm:p-6 lg:p-7 shadow-2xl backdrop-blur-md space-y-6 ${className}`}>
  <!-- Top decorative accent -->
  <div class="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

  <!-- Header Skeleton -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
    <div class="space-y-2">
      <div class="flex items-center gap-2.5">
        <div class="h-7 w-52 rounded-xl animate-shimmer"></div>
        <div class="h-5 w-24 rounded-full animate-shimmer"></div>
      </div>
      <div class="h-4 w-80 max-w-full rounded-md animate-shimmer"></div>
    </div>

    <!-- Metric Toggle Pills Skeleton -->
    <div class="flex items-center gap-2 self-start sm:self-auto">
      <div class="h-9 w-32 rounded-xl animate-shimmer"></div>
      <div class="h-9 w-36 rounded-xl animate-shimmer"></div>
    </div>
  </div>

  <!-- Region Filter Pills Skeleton -->
  <div class="space-y-2">
    <div class="h-4 w-40 rounded-md animate-shimmer"></div>
    <div class="flex items-center gap-2 overflow-x-auto pb-1">
      {#each Array(7) as _, i}
        <div class="h-8 w-28 rounded-xl animate-shimmer shrink-0"></div>
      {/each}
    </div>
  </div>

  <!-- Main Hero Grid: Left Map + Right Inspector Skeleton -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <!-- Left: Map Visual Area Skeleton (7 cols) -->
    <div class="lg:col-span-7 xl:col-span-7">
      <div class="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center p-6">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0,transparent_70%)] pointer-events-none"></div>
        
        <!-- Shimmering geographic silhouette blocks -->
        <div class="w-full max-w-3xl h-full flex flex-col justify-between py-6 opacity-60">
          <div class="flex justify-around items-center gap-8 px-4">
            <div class="space-y-2">
              <div class="h-16 w-32 rounded-2xl animate-shimmer"></div>
              <div class="h-10 w-24 rounded-xl animate-shimmer ml-4"></div>
            </div>
            <div class="space-y-2">
              <div class="h-14 w-40 rounded-2xl animate-shimmer"></div>
              <div class="h-14 w-52 rounded-2xl animate-shimmer -ml-6"></div>
            </div>
            <div class="space-y-2">
              <div class="h-18 w-28 rounded-2xl animate-shimmer"></div>
            </div>
          </div>

          <div class="flex justify-around items-center gap-8 px-8">
            <div class="h-24 w-20 rounded-2xl animate-shimmer"></div>
            <div class="h-28 w-24 rounded-3xl animate-shimmer"></div>
            <div class="space-y-2">
              <div class="h-5 w-10 rounded-lg animate-shimmer"></div>
              <div class="h-16 w-28 rounded-2xl animate-shimmer"></div>
            </div>
          </div>
        </div>

        <!-- Center Loading Badge -->
        <div class="absolute z-10 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          <div class="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
          <span class="text-xs font-semibold text-slate-200">Memuat Visualisasi Peta Kurs Dunia...</span>
        </div>
      </div>
    </div>

    <!-- Right: Inspector Skeleton Panel (5 cols) -->
    <div class="lg:col-span-5 xl:col-span-5 space-y-4">
      <div class="rounded-2xl bg-slate-950/80 border border-slate-800/90 p-5 space-y-4">
        <!-- Country Header Skeleton -->
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl animate-shimmer"></div>
            <div class="space-y-1.5">
              <div class="h-5 w-36 rounded-lg animate-shimmer"></div>
              <div class="h-3.5 w-24 rounded-md animate-shimmer"></div>
            </div>
          </div>
          <div class="h-6 w-16 rounded-xl animate-shimmer"></div>
        </div>

        <!-- Metric Grid Skeleton -->
        <div class="grid grid-cols-2 gap-2.5">
          {#each Array(4) as _}
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div class="h-3 w-20 rounded-md animate-shimmer"></div>
              <div class="h-5 w-24 rounded-lg animate-shimmer"></div>
            </div>
          {/each}
        </div>

        <!-- Mini Converter Skeleton -->
        <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2.5">
          <div class="h-4 w-36 rounded-md animate-shimmer"></div>
          <div class="h-9 w-full rounded-xl animate-shimmer"></div>
          <div class="h-12 w-full rounded-xl animate-shimmer"></div>
        </div>

        <!-- Mini Bank Matrix Skeleton -->
        <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div class="h-4 w-40 rounded-md animate-shimmer"></div>
          <div class="h-20 w-full rounded-xl animate-shimmer"></div>
        </div>

        <div class="h-10 w-full rounded-xl animate-shimmer"></div>
      </div>
    </div>
  </div>
</div>
