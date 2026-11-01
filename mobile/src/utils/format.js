/** Money is integer paise everywhere; format only at the edge. */
export function formatMoney(paise = 0, { compact = false } = {}) {
  const rupees = (paise || 0) / 100;
  if (compact && rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (compact && rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(iso, lang = 'en') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function timeAgo(iso, lang = 'en') {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hi = lang === 'hi';
  if (mins < 1) return hi ? 'अभी' : 'now';
  if (mins < 60) return hi ? `${mins} मिनट` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hi ? `${hours} घंटे` : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return hi ? `${days} दिन` : `${days}d`;
  return formatDate(iso, lang);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

/** Phones are stored as E.164; bare 10-digit numbers are legacy Indian records. */
export function formatPhone(phone = '') {
  return /^\d{10}$/.test(phone) ? `+91${phone}` : phone;
}
