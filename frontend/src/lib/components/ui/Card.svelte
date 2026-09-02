<script lang="ts">
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    hover?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    hover = false,
    class: className = '',
    children,
  }: Props = $props();

  const computedClass = $derived(
    twMerge(
      'bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl shadow-black/20 text-slate-100 transition-all duration-200',
      hover && 'hover:border-slate-700/80 hover:bg-slate-900/95 hover:shadow-indigo-950/20',
      className
    )
  );
</script>

<div class={computedClass}>
  {@render children?.()}
</div>
