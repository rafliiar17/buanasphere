<script lang="ts">
  import { ShieldCheck } from 'lucide-svelte';
</script>

<header style="position:sticky;top:0;z-index:50;width:100%;background:var(--bg);border-bottom:1px solid var(--bg-rule);">

  <!-- Disclaimer strip — single hairline, understated -->
  <div style="background:var(--bg-subtle);border-bottom:1px solid var(--bg-rule);padding:4px 16px;display:flex;align-items:center;justify-content:center;gap:6px;">
    <ShieldCheck style="width:11px;height:11px;color:var(--ink-4);flex-shrink:0;" />
    <span style="font-size:10px;color:var(--ink-4);letter-spacing:0.02em;">
      Informasi kurs publik · 100% gratis · Non-fintech · Tanpa registrasi wajib
    </span>
  </div>

  <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;">

    <!-- Wordmark -->
    <a href="/" style="display:flex;align-items:baseline;gap:1px;text-decoration:none;">
      <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;color:var(--ink);font-family:var(--font-sans);">
        Kurs
      </span>
      <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;color:var(--signal);font-family:var(--font-sans);">
        .World
      </span>
      <span style="margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-4);padding:2px 5px;border:1px solid var(--bg-rule);border-radius:3px;line-height:1.4;">
        Beta
      </span>
    </a>

    <!-- Right — live status + API link -->
    <div style="display:flex;align-items:center;gap:16px;">

      <!-- Live sync indicator -->
      <div style="display:none;align-items:center;gap:7px;font-size:11px;color:var(--ink-3);" class="sm-flex">
        <span class="live-dot"></span>
        <span>Edge Sync</span>
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
        Public API
      </a>
    </div>
  </div>
</header>

<style>
  @media (min-width: 640px) {
    .sm-flex { display: flex !important; }
  }
</style>
