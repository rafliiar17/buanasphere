<script lang="ts">
  import { ShieldCheck, Globe, Sun, Moon, Sparkles, ChevronDown } from 'lucide-svelte';
  import { t, getLocale, setLocale, subscribeLocale, SUPPORTED_LOCALES, type SupportedLocale } from '$lib/i18n';
  import { getTheme, toggleTheme, subscribeTheme, type Theme } from '$lib/theme';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { resolveAppIdToPath } from '$lib/framework/geoglobe/router';
  import { onMount } from 'svelte';

  let currentLang = $state<SupportedLocale>(getLocale());
  let currentTheme = $state<Theme>(getTheme());

  const activeApp = $derived(geoStore.activeApp);

  const brandParts = $derived.by(() => {
    switch (activeApp.id) {
      case 'world-time':
        return { main: 'Time', sub: '.World' };
      case 'remittance-flow':
        return { main: 'Flow', sub: '.Corridors' };
      case 'passport-power':
        return { main: 'Passport', sub: '.World' };
      case 'flora-fauna':
        return { main: 'Nature', sub: '.World' };
      default:
        return { main: 'Kurs', sub: '.World' };
    }
  });

  onMount(() => {
    const unsubLang = subscribeLocale((l) => {
      currentLang = l;
    });
    const unsubTheme = subscribeTheme((th) => {
      currentTheme = th;
    });
    return () => {
      unsubLang();
      unsubTheme();
    };
  });

  function handleLanguageChange(locale: SupportedLocale) {
    setLocale(locale);
  }

  function handleToggleTheme() {
    toggleTheme();
  }
</script>

<header style="position:sticky;top:0;z-index:50;width:100%;background:var(--bg);border-bottom:1px solid var(--bg-rule);">

  <!-- Disclaimer strip — single hairline, understated -->
  <div style="background:var(--bg-subtle);border-bottom:1px solid var(--bg-rule);padding:4px 16px;display:flex;align-items:center;justify-content:center;gap:6px;">
    <ShieldCheck style="width:11px;height:11px;color:var(--ink-4);flex-shrink:0;" />
    <span style="font-size:10px;color:var(--ink-4);letter-spacing:0.02em;">
      {t('navbar.disclaimerStrip')}
    </span>
  </div>

  <div style="max-width:2000px;margin:0 auto;padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;" class="max-w-8xl">

    <!-- Left: Wordmark & App Switcher -->
    <div style="display:flex;align-items:center;gap:16px;">
      <!-- Wordmark -->
      <a href={resolveAppIdToPath(activeApp.id)} style="display:flex;align-items:baseline;gap:1px;text-decoration:none;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;color:var(--ink);font-family:var(--font-sans);">
          {brandParts.main}
        </span>
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;color:var(--signal);font-family:var(--font-sans);">
          {brandParts.sub}
        </span>
        <span style="margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);padding:2px 5px;border:1px solid var(--bg-rule);border-radius:3px;line-height:1.4;">
          {t('common.beta')}
        </span>
      </a>

      <!-- App Switcher Trigger Button -->
      <button
        type="button"
        onclick={() => geoStore.toggleLauncher()}
        class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition-all shadow-sm cursor-pointer"
        title="Pilih Aplikasi GeoGlobe"
      >
        <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
        <span>{activeApp.name}</span>
        <ChevronDown class="w-3 h-3 text-emerald-400 opacity-70" />
      </button>
    </div>

    <!-- Right — Language switcher + Theme switcher + live status + API link -->
    <div style="display:flex;align-items:center;gap:10px;">

      <!-- Language Selector Toggle -->
      <div style="display:flex;align-items:center;background:var(--bg-subtle);border:1px solid var(--bg-rule);border-radius:var(--radius);padding:2px;">
        {#each SUPPORTED_LOCALES as loc}
          {@const isActive = currentLang === loc.code}
          <button
            type="button"
            onclick={() => handleLanguageChange(loc.code)}
            style="
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              font-size: 11px;
              font-weight: 700;
              border-radius: var(--radius-sm);
              border: none;
              cursor: pointer;
              transition: all 120ms;
              background: {isActive ? 'var(--accent)' : 'transparent'};
              color: {isActive ? 'var(--accent-fg)' : 'var(--ink-3)'};
            "
            title={loc.name}
          >
            <span>{loc.flag}</span>
            <span>{loc.code.toUpperCase()}</span>
          </button>
        {/each}
      </div>

      <!-- Theme Switcher Button (Dark / Light) -->
      <button
        type="button"
        onclick={handleToggleTheme}
        aria-label={currentTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
        title={currentTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 30px;
          background: var(--bg-subtle);
          border: 1px solid var(--bg-rule);
          border-radius: var(--radius);
          cursor: pointer;
          color: var(--ink-3);
          transition: all 120ms;
        "
        onmouseenter={(e) => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--ink)'; }}
        onmouseleave={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--ink-3)'; }}
      >
        {#if currentTheme === 'dark'}
          <Sun style="width:14px;height:14px;color:#FBBF24;" />
        {:else}
          <Moon style="width:14px;height:14px;color:#6366F1;" />
        {/if}
      </button>

      <!-- Live sync indicator -->
      <div style="display:none;align-items:center;gap:7px;font-size:11px;color:var(--ink-3);" class="sm-flex">
        <span class="live-dot"></span>
        <span>{t('common.liveSync')}</span>
      </div>

      <!-- Public API link -->
      <a
        href="/api/v1/docs"
        target="_blank"
        rel="noopener noreferrer"
        style="font-size:12px;font-weight:600;color:var(--ink-3);text-decoration:none;padding:5px 12px;border:1px solid var(--bg-rule);border-radius:var(--radius);transition:all 120ms;"
        onmouseenter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--ink)'; }}
        onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-3)'; }}
      >
        {t('navbar.publicApiDocs')}
      </a>
    </div>
  </div>
</header>

<style>
  @media (min-width: 640px) {
    .sm-flex { display: flex !important; }
  }
</style>
