<script lang="ts">
  import type { Snippet } from 'svelte';
  import { clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'default',
    size = 'md',
    type = 'button',
    disabled = false,
    class: className = '',
    onclick,
    children,
  }: Props = $props();

  const variantClasses = {
    default: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-950/50 active:scale-[0.98]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-slate-800/80 text-slate-200 border border-slate-700 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-950/50 active:scale-[0.98]',
    subtle: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  };

  const sizeClasses = {
    sm: 'text-xs h-8 px-3 rounded-lg gap-1.5',
    md: 'text-sm h-10 px-4 rounded-xl gap-2',
    lg: 'text-base h-12 px-6 rounded-xl gap-2.5 font-semibold',
    icon: 'h-10 w-10 rounded-xl justify-center',
  };

  const computedClass = $derived(
    twMerge(
      'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none',
      variantClasses[variant],
      sizeClasses[size],
      className
    )
  );
</script>

<button
  {type}
  {disabled}
  class={computedClass}
  {onclick}
>
  {@render children?.()}
</button>
