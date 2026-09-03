/**
 * Formatters untuk mata uang, persentase, dan waktu standar Indonesia (id-ID) & global.
 * Aligned with AGENTS.md and CONTEXT.md standards.
 */

export interface FormatRupiahOptions {
  showFraction?: boolean;
  withPrefix?: boolean;
}

export interface FormatCurrencyOptions {
  minDecimals?: number;
  maxDecimals?: number;
}

/**
 * Format angka ke standar Rupiah Indonesia (locale id-ID).
 * Contoh: 15850 -> 'Rp 15.850,00' (atau '15.850' jika tanpa prefix & fraction).
 */
export function formatRupiah(
  amount: number,
  options: FormatRupiahOptions = {}
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

/**
 * Format persentase pergerakan nilai tukar.
 * Contoh: 0.25 -> '+0.25%', -0.15 -> '-0.15%', 0 -> '0.00%'.
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.00%';
  }
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * Format angka ke mata uang asing dengan symbol/currency code.
 * Jika IDR, didelegasikan ke formatRupiah.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: FormatCurrencyOptions = {}
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0';
  }

  const normalizedCode = currencyCode.toUpperCase();

  if (normalizedCode === 'IDR') {
    return formatRupiah(amount, {
      showFraction: amount % 1 !== 0,
      withPrefix: true,
    });
  }

  const minDecimals = options.minDecimals ?? (amount > 0 && amount < 1 ? 4 : 2);
  const maxDecimals = options.maxDecimals ?? (amount > 0 && amount < 1 ? 4 : 2);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCode,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(amount);
  } catch {
    // Fallback if invalid currency code in Intl
    const num = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(amount);
    return `${normalizedCode} ${num}`;
  }
}

/**
 * Format tanggal & jam standar Indonesia (WIB/local).
 */
export function formatDateTimeIndo(dateInput: string | Date | number): string {
  const date =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

/**
 * Format waktu relatif human-readable dalam bahasa Indonesia.
 */
export function formatTimeAgo(dateInput: string | Date | number): string {
  const date =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} detik lalu`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  return `${Math.floor(diffSec / 86400)} hari lalu`;
}

/**
 * Format angka compact (e.g. 275 Jt, 1.2 M).
 */
export function formatCompactNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} M`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} Jt`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)} rb`;
  }
  return num.toString();
}
