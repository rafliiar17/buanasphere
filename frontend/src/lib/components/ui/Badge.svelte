<script lang="ts">
  import type { Snippet } from 'svelte';
  import { clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'default',
    size = 'md',
    class: className = '',
    children,
  }: Props = $props();

  const variantClasses = {
    default: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'bg-transparent text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    destructive: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const computedClass = $derived(
    twMerge(
      'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
      variantClasses[variant],
      sizeClasses[size],
      className
    )
  );
</script>

<span class={computedClass}>
  {@render children?.()}
</span>
