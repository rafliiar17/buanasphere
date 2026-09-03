<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Copy, 
    Check, 
    ArrowUpRight, 
    ArrowDownRight,
    Link2,
    Eye,
    X,
    Send,
    MessageSquare
  } from 'lucide-svelte';
  import { apiClient, SUPPORTED_CURRENCIES } from '$lib/api/client';
  import type { RateItem } from '$lib/api/types';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t, formatDateTimeLocale } from '$lib/i18n';

  let rates = $state<RateItem[]>([]);
  let isLoading = $state(true);
  let isCopied = $state(false);
  let copiedLinks = $state<Record<string, boolean>>({});
  let copiedQuotes = $state<Record<string, boolean>>({});
  let previewItem = $state<RateItem | null>(null);

  async function loadRates() {
    isLoading = true;
    try {
      rates = await apiClient.getLiveRates('IDR');
    } catch (e) {
      console.error('Error fetching live rates:', e);
    } finally {
      isLoading = false;
    }
  }

  function getCurrencyFlag(code: string) {
    return SUPPORTED_CURRENCIES.find(c => c.code === code)?.flag || '🌐';
  }

  function getDirectLink(currency: string) {
    return `https://globe.arafz.id/kurs?from=${currency}&to=IDR`;
  }

  function formatSingleQuote(item: RateItem): string {
    const now = formatDateTimeLocale(new Date());
    return [
      `💱 *KURS HARI INI: ${item.targetCurrency} ➔ IDR*`,
      `🕒 ${now}`,
      `🏦 Sumber: ${item.providerName || 'Agregator Kurs World'}`,
      '',
      `🟢 *Beli:* ${formatRupiah(item.buyRate)}`,
      `🔴 *Jual:* ${formatRupiah(item.sellRate)}`,
      `📊 *Perubahan (24j):* ${formatPercent(item.change24h || 0)}`,
      '',
      '🔗 *Pantau Live Rate & Visualisasi 3D:*',
      getDirectLink(item.targetCurrency),
    ].join('\n');
  }

  function copyDirectLink(currency: string) {
    const link = getDirectLink(currency);
    navigator.clipboard.writeText(link);
    copiedLinks = { ...copiedLinks, [currency]: true };
    setTimeout(() => {
      copiedLinks = { ...copiedLinks, [currency]: false };
    }, 2000);
  }

  function copyItemQuote(item: RateItem) {
    const quote = formatSingleQuote(item);
    navigator.clipboard.writeText(quote);
    copiedQuotes = { ...copiedQuotes, [item.targetCurrency]: true };
    setTimeout(() => {
      copiedQuotes = { ...copiedQuotes, [item.targetCurrency]: false };
    }, 2000);
  }

  function shareWhatsApp(item: RateItem) {
    const quote = formatSingleQuote(item);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(quote)}`, '_blank');
  }

  function shareTelegram(item: RateItem) {
    const quote = formatSingleQuote(item);
    const link = getDirectLink(item.targetCurrency);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(quote)}`, '_blank');
  }

  function copySummary() {
    if (rates.length === 0) return;
    const now = formatDateTimeLocale(new Date());
    let text = `${t('cards.shareTitle')}\n🕒 ${now}\n${t('cards.shareSource')}\n\n`;

    rates.slice(0, 6).forEach(r => {
      const flag = getCurrencyFlag(r.targetCurrency);
      text += `${flag} *${r.targetCurrency}/IDR*\n`;
      text += `  • ${t('cards.shareBuy')} : ${formatRupiah(r.buyRate)}\n`;
      text += `  • ${t('cards.shareSell')} : ${formatRupiah(r.sellRate)}\n`;
      text += `  • ${t('cards.shareChange')}  : ${formatPercent(r.change24h || 0)}\n\n`;
    });

    text += `🔗 Cek perbandingan lengkap: https://globe.arafz.id/kurs\n${t('cards.shareFooter')}`;

    navigator.clipboard.writeText(text);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2500);
  }

  onMount(() => {
    loadRates();
  });
</script>

<!-- Rate Cards: snapshot format for sharing -->
<div style="display:flex;flex-direction:column;gap:20px;">

  <!-- Section header -->
  <div style="border-bottom:2px solid var(--ink);padding-bottom:14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:4px;">
        {t('cards.badge')}
      </p>
      <h2 style="font-size:20px;font-weight:700;color:var(--ink);margin:0;">
        {t('cards.title')}
      </h2>
      <p style="font-size:12px;color:var(--ink-3);margin-top:4px;">
        {t('cards.subtitle')}
      </p>
    </div>

    <button
      type="button"
      class="btn btn-ghost btn-sm"
      onclick={copySummary}
      style="display:flex;align-items:center;gap:6px;"
    >
      {#if isCopied}
        <Check style="width:13px;height:13px;color:var(--pos);" />
        <span style="color:var(--pos);font-weight:700;">{t('cards.copied')}</span>
      {:else}
        <Copy style="width:13px;height:13px;" />
        <span>{t('cards.copyButton')}</span>
      {/if}
    </button>
  </div>

  {#if isLoading}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
      {#each Array(6) as _}
        <div style="border:1px solid var(--bg-rule);border-radius:var(--radius);padding:16px;background:var(--bg-raised);">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <div style="height:16px;width:100px;border-radius:2px;" class="animate-shimmer"></div>
            <div style="height:16px;width:50px;border-radius:2px;" class="animate-shimmer"></div>
          </div>
          <div style="height:40px;border-radius:2px;" class="animate-shimmer"></div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Grid of currency cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;">
      {#each rates.slice(0, 6) as item}
        {@const flag = getCurrencyFlag(item.targetCurrency)}
        {@const isUp = (item.change24h || 0) >= 0}
        {@const curr = item.targetCurrency}
        <div style="
          border:1px solid var(--bg-rule);
          border-radius:var(--radius);
          padding:16px;
          background:var(--bg-raised);
          display:flex;
          flex-direction:column;
          gap:12px;
          transition:border-color 120ms;
        ">
          <!-- Card Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">{flag}</span>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--ink);">{item.targetCurrency} / IDR</div>
                <div style="font-size:11px;color:var(--ink-4);">{item.providerName}</div>
              </div>
            </div>
            <span class={isUp ? 'pill-pos' : 'pill-neg'} style="font-size:11px;display:inline-flex;align-items:center;gap:2px;">
              {#if isUp}
                <ArrowUpRight style="width:11px;height:11px;" />
              {:else}
                <ArrowDownRight style="width:11px;height:11px;" />
              {/if}
              {formatPercent(item.change24h || 0)}
            </span>
          </div>

          <!-- Buy & Sell Rate Cells -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid var(--bg-rule);padding-top:10px;">
            <div style="padding:8px 10px;background:var(--pos-bg);border:1px solid var(--pos-rule);border-radius:var(--radius-sm);">
              <span style="display:block;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--pos);">
                {t('cards.buyLabel')}
              </span>
              <div style="font-size:14px;font-weight:700;color:var(--ink);margin-top:2px;font-variant-numeric:tabular-nums;">
                {formatRupiah(item.buyRate)}
              </div>
            </div>
            <div style="padding:8px 10px;background:var(--bg-subtle);border:1px solid var(--bg-rule);border-radius:var(--radius-sm);">
              <span style="display:block;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-4);">
                {t('cards.sellLabel')}
              </span>
              <div style="font-size:14px;font-weight:700;color:var(--ink);margin-top:2px;font-variant-numeric:tabular-nums;">
                {formatRupiah(item.sellRate)}
              </div>
            </div>
          </div>

          <!-- Deep Link Badge -->
          <div class="flex items-center justify-between text-[10px] font-mono bg-slate-950/40 border border-[var(--bg-rule)] rounded px-2.5 py-1.5 text-[var(--ink-3)]">
            <span class="truncate pr-2">globe.arafz.id/kurs?from={curr}&to=IDR</span>
            <button
              type="button"
              onclick={() => copyDirectLink(curr)}
              class="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition shrink-0 cursor-pointer"
              title="Salin Link Langsung"
            >
              {#if copiedLinks[curr]}
                <Check class="w-3 h-3 text-emerald-400" />
                <span class="text-emerald-400">Tersalin</span>
              {:else}
                <Link2 class="w-3 h-3" />
                <span>Salin Link</span>
              {/if}
            </button>
          </div>

          <!-- Card Actions Bar (Share Quote, WhatsApp, Telegram, Preview Visual) -->
          <div class="pt-2 border-t border-[var(--bg-rule)] flex items-center justify-between gap-1.5 text-xs">
            <button
              type="button"
              onclick={() => (previewItem = item)}
              class="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-slate-800 text-[var(--ink)] text-[11px] font-semibold border border-[var(--bg-rule)] transition cursor-pointer"
              title="Preview Share Visual"
            >
              <Eye class="w-3 h-3 text-cyan-400" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onclick={() => copyItemQuote(item)}
              class="inline-flex items-center justify-center p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-slate-800 text-[var(--ink)] text-[11px] font-medium border border-[var(--bg-rule)] transition cursor-pointer"
              title="Salin Teks Kutipan"
            >
              {#if copiedQuotes[curr]}
                <Check class="w-3.5 h-3.5 text-emerald-400" />
              {:else}
                <Copy class="w-3.5 h-3.5" />
              {/if}
            </button>

            <button
              type="button"
              onclick={() => shareWhatsApp(item)}
              class="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition cursor-pointer"
              title="Bagikan ke WhatsApp"
            >
              <MessageSquare class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onclick={() => shareTelegram(item)}
              class="inline-flex items-center justify-center p-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-400 border border-sky-800/50 transition cursor-pointer"
              title="Bagikan ke Telegram"
            >
              <Send class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Visual Share Modal Preview -->
  {#if previewItem}
    {@const flag = getCurrencyFlag(previewItem.targetCurrency)}
    {@const isUp = (previewItem.change24h || 0) >= 0}
    {@const curr = previewItem.targetCurrency}
    <div
      role="presentation"
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
      onclick={() => (previewItem = null)}
      onkeydown={(e) => e.key === 'Escape' && (previewItem = null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preview Share Visual"
        tabindex="-1"
        class="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === 'Escape' && (previewItem = null)}
      >
        <button
          type="button"
          aria-label="Tutup Preview"
          onclick={() => (previewItem = null)}
          class="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Preview Card Snapshot -->
        <div class="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 p-5 shadow-inner space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-3xl">{flag}</span>
              <div>
                <h3 class="text-base font-extrabold text-white tracking-tight">
                  {previewItem.targetCurrency} / IDR
                </h3>
                <span class="text-[11px] text-slate-400">
                  {previewItem.providerName}
                </span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold border {isUp ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}">
              {formatPercent(previewItem.change24h || 0)}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Beli</span>
              <span class="text-lg font-bold font-mono text-white mt-0.5 block">{formatRupiah(previewItem.buyRate)}</span>
            </div>
            <div class="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jual</span>
              <span class="text-lg font-bold font-mono text-white mt-0.5 block">{formatRupiah(previewItem.sellRate)}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>globe.arafz.id/kurs</span>
            <span>Real-Time Edge Aggregator</span>
          </div>
        </div>

        <!-- Quick Share Action Buttons inside Modal -->
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => copyDirectLink(curr)}
              class="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {#if copiedLinks[curr]}
                <Check class="w-3.5 h-3.5 text-emerald-400" />
                <span class="text-emerald-400">Link Tersalin</span>
              {:else}
                <Link2 class="w-3.5 h-3.5" />
                <span>Salin Link</span>
              {/if}
            </button>

            <button
              type="button"
              onclick={() => copyItemQuote(previewItem!)}
              class="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {#if copiedQuotes[curr]}
                <Check class="w-3.5 h-3.5 text-emerald-400" />
                <span class="text-emerald-400">Teks Tersalin</span>
              {:else}
                <Copy class="w-3.5 h-3.5" />
                <span>Salin Kutipan</span>
              {/if}
            </button>
          </div>

          <button
            type="button"
            onclick={() => shareWhatsApp(previewItem!)}
            class="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Bagikan ke WhatsApp</span>
          </button>

          <button
            type="button"
            onclick={() => shareTelegram(previewItem!)}
            class="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-sky-950/40"
          >
            <Send class="w-4 h-4" />
            <span>Bagikan ke Telegram</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
