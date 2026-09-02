<script lang="ts">
  import { twMerge } from 'tailwind-merge';

  interface Props {
    value?: string | number;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    class?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
    onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
    onkeydown?: (e: KeyboardEvent & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    disabled = false,
    readonly = false,
    class: className = '',
    min,
    max,
    step,
    oninput,
    onchange,
    onkeydown,
  }: Props = $props();

  const computedClass = $derived(
    twMerge(
      'w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm font-medium transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )
  );
</script>

<input
  {type}
  bind:value
  {placeholder}
  {disabled}
  {readonly}
  {min}
  {max}
  {step}
  class={computedClass}
  {oninput}
  {onchange}
  {onkeydown}
/>
