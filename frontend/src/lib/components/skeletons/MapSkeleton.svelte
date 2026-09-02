<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-4 sm:p-6 lg:p-7 shadow-2xl backdrop-blur-md space-y-5 sm:space-y-6 ${className}`}>
  <!-- Top decorative accent -->
  <div class="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

  <!-- Top Header Skeleton: Title, Live Badge & Metric Switcher -->
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
    <div class="space-y-2">
      <div class="flex items-center gap-2.5">
        <div class="h-9 w-9 rounded-xl animate-shimmer"></div>
        <div class="h-7 w-60 rounded-xl animate-shimmer"></div>
        <div class="h-5 w-24 rounded-full animate-shimmer"></div>
      </div>
      <div class="h-4 w-96 max-w-full rounded-md animate-shimmer"></div>
    </div>

    <!-- Metric Switcher Pills & Reset Button Skeleton -->
    <div class="flex items-center gap-2 self-start lg:self-auto">
      <div class="h-10 w-32 rounded-2xl animate-shimmer"></div>
      <div class="h-10 w-36 rounded-2xl animate-shimmer"></div>
      <div class="h-10 w-24 rounded-2xl animate-shimmer"></div>
    </div>
  </div>

  <!-- Top Controls Toolbar Skeleton: Search Bar + Region Filter Pills -->
  <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
    <!-- Search Bar Skeleton -->
    <div class="h-10 w-full md:w-96 rounded-2xl animate-shimmer"></div>

    <!-- Region Filter Pills Skeleton -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1">
      {#each Array(8) as _, i}
        <div class="h-9 w-24 sm:w-28 rounded-xl animate-shimmer shrink-0"></div>
      {/each}
    </div>
  </div>

  <!-- Quick Selection Strip Skeleton -->
  <div class="flex items-center gap-2 overflow-x-auto pb-1">
    <div class="h-5 w-20 rounded-md animate-shimmer shrink-0"></div>
    {#each Array(10) as _, i}
      <div class="h-7 w-16 rounded-xl animate-shimmer shrink-0"></div>
    {/each}
  </div>

  <!-- 100% Full-Width Map Canvas Area Skeleton -->
  <div class="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden flex flex-col items-center justify-center p-6">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0,transparent_70%)] pointer-events-none"></div>

    <!-- Top Mode Badge Skeleton -->
    <div class="absolute top-4 left-4 h-7 w-44 rounded-xl animate-shimmer"></div>

    <!-- Shimmering geographic silhouette blocks representing continents -->
    <div class="w-full max-w-8xl h-full flex flex-col justify-between py-10 opacity-60">
      <!-- Northern Hemisphere (Americas, Europe, Asia) -->
      <div class="flex justify-around items-center gap-12 px-6">
        <div class="space-y-3">
          <div class="h-20 w-44 rounded-3xl animate-shimmer"></div>
          <div class="h-14 w-32 rounded-2xl animate-shimmer ml-6"></div>
        </div>
        <div class="space-y-3">
          <div class="h-16 w-48 rounded-2xl animate-shimmer"></div>
          <div class="h-20 w-72 rounded-3xl animate-shimmer -ml-8"></div>
        </div>
        <div class="space-y-3">
          <div class="h-24 w-40 rounded-3xl animate-shimmer"></div>
          <div class="h-16 w-32 rounded-2xl animate-shimmer ml-4"></div>
        </div>
      </div>

      <!-- Equatorial & Southern Hemisphere (South America, Africa, Oceania) -->
      <div class="flex justify-around items-center gap-12 px-12">
        <div class="h-32 w-28 rounded-3xl animate-shimmer"></div>
        <div class="h-36 w-32 rounded-3xl animate-shimmer"></div>
        <div class="space-y-3">
          <div class="h-10 w-24 rounded-xl animate-shimmer"></div>
          <div class="h-20 w-36 rounded-3xl animate-shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Center Interactive Loading Spinner & Badge -->
    <div class="absolute z-10 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md">
      <div class="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
      <span class="text-xs sm:text-sm font-bold text-slate-200">Menyiapkan Peta Valuta Asing Dunia 195+ Negara...</span>
    </div>

    <!-- Bottom Inspector Pill Skeleton -->
    <div class="absolute bottom-4 left-4 h-10 w-64 rounded-2xl animate-shimmer"></div>
  </div>
</div>
