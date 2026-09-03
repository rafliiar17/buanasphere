<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  export interface SelectOption {
    value: string;
    label: string;
    sublabel?: string;
    icon?: string;
  }

  interface Props {
    options: SelectOption[];
    value?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    options = [],
    value = $bindable(''),
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    value = target.value;
    onchange?.(target.value);
  }

  const computedClass = $derived(
    twMerge(
      'w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer pr-10',
      className
    )
  );
</script>

<div class="relative w-full">
  <select
    {value}
    {disabled}
    class={computedClass}
    onchange={handleChange}
  >
    {#each options as opt}
      <option value={opt.value} class="bg-slate-900 text-slate-100 py-2">
        {opt.icon ? `${opt.icon} ` : ''}{opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
      </option>
    {/each}
  </select>
  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</div>
