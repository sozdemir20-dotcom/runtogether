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

export const MOCK_USERS = {
  me: { id: 'me', name: 'Sen', avatar: '🏃', level: 'Orta Seviye' },
  u1: { id: 'u1', name: 'Elif Demir', avatar: '🏃‍♀️', level: 'İleri Seviye' },
  u2: { id: 'u2', name: 'Kaan Yılmaz', avatar: '🏃‍♂️', level: 'Başlangıç' },
  u3: { id: 'u3', name: 'Selin Aktaş', avatar: '🏃‍♀️', level: 'İleri Seviye' },
  u4: { id: 'u4', name: 'Burak Çelik', avatar: '🏃‍♂️', level: 'Orta Seviye' },
  u5: { id: 'u5', name: 'Zeynep Koç', avatar: '🏃‍♀️', level: 'Orta Seviye' },
};

export const MOCK_ROUTES = [
  {
    id: 1, userId: 'u1', title: 'Caddebostan Sahil Koşusu',
    distance: 8.2, pace: '5:30', duration: '45:06',
    date: '2026-03-12', time: '07:00', elevation: 12,
    description: 'Sahil boyunca düz parkur, rüzgâr olabilir. Gün doğumu manzarası harika!',
    tags: ['sahil', 'düz', 'sabah'],
    participants: ['u1', 'u4'], maxParticipants: 6, difficulty: 'Orta',
    routePoints: [
      { x: 15, y: 60 }, { x: 25, y: 55 }, { x: 40, y: 50 }, { x: 55, y: 48 },
      { x: 65, y: 52 }, { x: 75, y: 55 }, { x: 85, y: 50 }, { x: 92, y: 45 },
    ],
    elevationProfile: [5, 8, 6, 10, 12, 8, 6, 10],
  },
  {
    id: 2, userId: 'u3', title: 'Belgrad Ormanı Trail',
    distance: 12.5, pace: '6:15', duration: '1:18:07',
    date: '2026-03-13', time: '08:30', elevation: 185,
    description: 'Orman patikası, yokuş iniş çıkışlı. Trail ayakkabısı şart!',
    tags: ['trail', 'orman', 'yokuşlu'],
    participants: ['u3'], maxParticipants: 4, difficulty: 'Zor',
    routePoints: [
      { x: 10, y: 70 }, { x: 20, y: 55 }, { x: 30, y: 40 }, { x: 40, y: 50 },
      { x: 50, y: 30 }, { x: 60, y: 45 }, { x: 75, y: 35 }, { x: 90, y: 50 },
    ],
    elevationProfile: [40, 80, 130, 95, 185, 140, 100, 65],
  },
  {
    id: 3, userId: 'u4', title: 'Maçka Parkı Tempo Koşusu',
    distance: 5.0, pace: '4:45', duration: '23:45',
    date: '2026-03-14', time: '18:30', elevation: 45,
    description: 'Park içi asfalt yol, tempo antrenmanı için ideal. 3 tur.',
    tags: ['park', 'tempo', 'akşam'],
    participants: ['u4', 'u5', 'u1'], maxParticipants: 8, difficulty: 'Orta',
    routePoints: [
      { x: 30, y: 60 }, { x: 40, y: 40 }, { x: 55, y: 35 }, { x: 65, y: 45 },
      { x: 70, y: 60 }, { x: 60, y: 70 }, { x: 45, y: 65 }, { x: 30, y: 60 },
    ],
    elevationProfile: [20, 35, 45, 40, 30, 25, 35, 20],
  },
  {
    id: 4, userId: 'u2', title: 'Fenerbahçe Parkı Easy Run',
    distance: 3.8, pace: '7:00', duration: '26:36',
    date: '2026-03-15', time: '09:00', elevation: 8,
    description: 'Yeni başlayanlar için harika bir rota. Düz ve gölgeli.',
    tags: ['park', 'kolay', 'başlangıç'],
    participants: ['u2'], maxParticipants: 10, difficulty: 'Kolay',
    routePoints: [
      { x: 25, y: 50 }, { x: 35, y: 40 }, { x: 50, y: 38 }, { x: 65, y: 42 },
      { x: 75, y: 50 }, { x: 65, y: 60 }, { x: 50, y: 62 }, { x: 35, y: 55 },
    ],
    elevationProfile: [3, 5, 6, 8, 6, 4, 5, 3],
  },
  {
    id: 5, userId: 'u5', title: 'Büyükada Turu',
    distance: 15.0, pace: '5:50', duration: '1:27:30',
    date: '2026-03-16', time: '07:30', elevation: 120,
    description: 'Ada turu koşusu, manzara eşliğinde uzun koşu. Vapur saatine dikkat!',
    tags: ['ada', 'uzun koşu', 'manzara'],
    participants: ['u5', 'u3'], maxParticipants: 5, difficulty: 'Zor',
    routePoints: [
      { x: 50, y: 80 }, { x: 30, y: 65 }, { x: 15, y: 45 }, { x: 20, y: 25 },
      { x: 40, y: 15 }, { x: 65, y: 18 }, { x: 80, y: 30 }, { x: 85, y: 55 },
      { x: 70, y: 75 }, { x: 50, y: 80 },
    ],
    elevationProfile: [10, 45, 90, 120, 80, 60, 100, 75, 30, 10],
  },
];

export const INITIAL_INVITES = [
  { id: 1, from: 'u1', routeId: 1, message: 'Sabah koşusuna katıl, harika olur!', status: 'pending' },
  { id: 2, from: 'u5', routeId: 5, message: 'Büyükada turu yapalım mı?', status: 'pending' },
];

export const FILTERS = ['Tümü', 'Kolay', 'Orta', 'Zor', 'Sahil', 'Trail', 'Park'];

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}
