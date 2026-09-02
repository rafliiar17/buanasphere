<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  export interface TabItem {
    id: string;
    label: string;
    icon?: string;
    badge?: string;
  }

  interface Props {
    tabs: TabItem[];
    activeTab?: string;
    class?: string;
    onchange?: (id: string) => void;
  }

  let {
    tabs = [],
    activeTab = $bindable(''),
    class: className = '',
    onchange,
  }: Props = $props();

  function selectTab(id: string) {
    activeTab = id;
    onchange?.(id);
  }
</script>

<div class={twMerge('flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl backdrop-blur-md', className)}>
  {#each tabs as tab}
    {@const isActive = activeTab === tab.id}
    <button
      type="button"
      class={twMerge(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none',
        isActive
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
      )}
      onclick={() => selectTab(tab.id)}
    >
      {#if tab.icon}
        <span>{tab.icon}</span>
      {/if}
      <span>{tab.label}</span>
      {#if tab.badge}
        <span class={twMerge(
          'text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
        )}>
          {tab.badge}
        </span>
      {/if}
    </button>
  {/each}
</div>
