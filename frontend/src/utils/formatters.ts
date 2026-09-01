export const humanize = (val?: any) => {
  if (val === null || val === undefined) return '—';
  const s = String(val);
  if (!s) return '—';
  return s
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const formatGender = (g?: string) => {
  if (!g) return '—';
  const s = String(g).trim().toLowerCase();
  if (s === 'm' || s === 'male') return 'Male';
  if (s === 'f' || s === 'female') return 'Female';
  if (s === 'o' || s === 'other') return 'Other';
  return humanize(s);
};

export const formatStatusLabel = (statusOrObj?: any) => {
  if (!statusOrObj) return '—';
  if (typeof statusOrObj === 'string' || typeof statusOrObj === 'number')
    return humanize(statusOrObj);
  if (statusOrObj.name) return humanize(statusOrObj.name);
  return humanize(JSON.stringify(statusOrObj));
};

export const formatApplicationType = (t?: any) => {
  if (!t) return 'Fresh';
  const map: Record<string, string> = {
    fresh: 'Fresh',
    renewal: 'Renewal',
    duplicate: 'Duplicate',
  };
  const key = String(t).trim().toLowerCase();
  return map[key] || humanize(key);
};

export const formatPhone = (p?: string) => {
  if (!p) return '—';
  const digits = String(p).replace(/[^0-9+]/g, '');
  if (digits.length >= 10 && digits.length <= 13) {
    return digits.replace(/(\+?\d{0,3})(\d{3})(\d{3})(\d{2,4})/, (m, c1, a, b, c) => {
      return [c1, a, b, c].filter(Boolean).join(' ');
    });
  }
  return p;
};
