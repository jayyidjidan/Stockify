export function formatIDR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(isoString);
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}
