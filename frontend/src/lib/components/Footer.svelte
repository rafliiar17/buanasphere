<script lang="ts">
  import { Shield, ExternalLink, Cpu, Heart, Code2 } from 'lucide-svelte';
  import { MOCK_PROVIDERS } from '$lib/api/client';
</script>

<footer class="mt-20 border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
    <!-- Provider Attributions Grid -->
    <div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
        Sumber Data Resmi & Afiliasi Terhubung:
      </h4>
      <div class="flex flex-wrap items-center gap-2">
        {#each MOCK_PROVIDERS as prov}
          <a
            href={prov.website}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 transition text-[11px] font-medium"
          >
            <span>{prov.shortName}</span>
            <ExternalLink class="w-3 h-3 text-slate-500" />
          </a>
        {/each}
      </div>
    </div>

    <!-- Legal Disclaimer -->
    <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
      <div class="flex items-center gap-2 text-slate-300 font-semibold">
        <Shield class="w-4 h-4 text-indigo-400" />
        <span>Pernyataan Bebas Tanggung Jawab (Disclaimer Non-Fintech)</span>
      </div>
      <p class="text-[11px] leading-relaxed text-slate-400">
        <strong>Informasi Dulu, Transaksi Belakangan.</strong> Kurs World adalah platform agregator informasi kurs valas publik independen. Kurs World bukan merupakan bank, pialang berjangka, money changer, atau lembaga jasa keuangan lainnya, dan tidak memfasilitasi transaksi valas secara langsung. Seluruh nilai kurs diambil langsung dari publikasi resmi masing-masing penyedia data dan dapat berubah sewaktu-waktu sesuai ketentuan bank penerbit tanpa pemberitahuan sebelumnya.
      </p>
    </div>

    <!-- Bottom Meta -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/60 text-[11px] text-slate-500">
      <div class="flex items-center gap-2">
        <span>© {new Date().getFullYear()} Kurs World. Open Information Platform.</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1">
          <Cpu class="w-3.5 h-3.5 text-indigo-400" />
          Edge Execution Sub-50ms (Cloudflare Workers)
        </span>
      </div>
    </div>
  </div>
</footer>
