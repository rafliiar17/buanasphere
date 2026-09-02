/**
 * Formatters untuk mata uang, persentase, dan waktu standar Indonesia (id-ID)
 */

export function formatRupiah(
  amount: number,
  options: { showFraction?: boolean; withPrefix?: boolean } = {}
): string {
  const { showFraction = true, withPrefix = true } = options;
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withPrefix ? 'Rp 0' : '0';
  }

  const fractionDigits = showFraction ? 2 : 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  return withPrefix ? `Rp ${formatted}` : formatted;
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: { minDecimals?: number; maxDecimals?: number } = {}
): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';

  if (currencyCode === 'IDR') {
    return formatRupiah(amount, { showFraction: amount % 1 !== 0 });
  }

  const minDecimals = options.minDecimals ?? (amount < 1 ? 4 : 2);
  const maxDecimals = options.maxDecimals ?? (amount < 1 ? 4 : 2);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0.00%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatDateTimeIndo(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function formatTimeAgo(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  return `${Math.floor(diffSec / 86400)} hari lalu`;
}
