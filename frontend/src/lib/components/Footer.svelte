<script lang="ts">
  import { ExternalLink } from 'lucide-svelte';
  import { MOCK_PROVIDERS } from '$lib/api/client';
  import { t } from '$lib/i18n';
</script>

<footer style="
  margin-top: 0;
  border-top: 2px solid var(--ink);
  background: var(--bg-subtle);
  color: var(--ink-3);
  font-size: 12px;
">
  <div style="max-width:1536px;margin:0 auto;padding:40px 24px 32px;">

    <!-- Provider attribution grid -->
    <div style="margin-bottom:28px;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:12px;">
        {t('footer.dataAttribution')}
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        {#each MOCK_PROVIDERS as prov}
          <a
            href={prov.website}
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-flex;align-items:center;gap:4px;
              padding:4px 10px;
              border:1px solid var(--bg-rule);
              border-radius:3px;
              font-size:11px;font-weight:500;
              color:var(--ink-3);
              text-decoration:none;
              background:var(--bg-raised);
              transition:all 120ms;
            "
            onmouseenter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onmouseleave={(e) => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--ink-3)'; }}
          >
            {prov.shortName}
            <ExternalLink style="width:9px;height:9px;opacity:0.5;" />
          </a>
        {/each}
      </div>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid var(--bg-rule);padding-top:20px;margin-bottom:16px;">
      <!-- Disclaimer -->
      <p style="font-size:11px;color:var(--ink-4);line-height:1.65;max-width:720px;">
        <strong style="color:var(--ink-3);">{t('footer.missionTitle')}:</strong>
        {t('footer.dataAttributionDesc')}
        {t('footer.disclaimer')}
      </p>
    </div>

    <!-- Bottom meta row -->
    <div style="
      display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
      padding-top:16px;border-top:1px solid var(--bg-rule);
      font-size:10px;color:var(--ink-4);
    ">
      <span>{t('footer.copyright')}</span>
      <span>{t('footer.edgeInfo')}</span>
    </div>
  </div>
</footer>
