export const COLORS = {
  bg: '#0F0F14',
  card: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  orange: '#F97316',
  orangeDark: '#EA580C',
  red: '#EF4444',
  green: '#22C55E',
  white: '#FFFFFF',
  text: 'rgba(255,255,255,0.9)',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.35)',
  textDim: 'rgba(255,255,255,0.2)',
  subtle: 'rgba(255,255,255,0.06)',
};

export const FILTERS = ['Tümü', 'Kolay', 'Orta', 'Zor', 'Sahil', 'Trail', 'Park'];

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}
