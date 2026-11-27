import client from '../api/client';

// Local calendar day / clock, so screen time and bedtime follow the phone's time zone.
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const nowHM = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + m; };

export function inBedtime(time) {
  if (!time?.bedtime_start || !time?.bedtime_end) return false;
  const n = nowHM(), s = toMin(time.bedtime_start), e = toMin(time.bedtime_end);
  return s <= e ? (n >= s && n < e) : (n >= s || n < e); // e.g. 20:00 → 07:00 wraps midnight
}
export const timeUp = (time) => !!time && time.limit_secs > 0 && time.left_secs === 0;
export const blockedReason = (time) => (inBedtime(time) ? 'bedtime' : timeUp(time) ? 'time' : null);

const get = (q) => client.get(`/kids.php?${q}&day=${today()}`).then(r => r.data);
const post = (action, body) => client.post(`/kids.php?action=${action}`, { ...body, day: today() }).then(r => r.data);

export const kidsApi = {
  home: () => get('action=home'),
  category: (cat) => get(`action=category&cat=${encodeURIComponent(cat)}`),
  search: (q) => get(`action=search&q=${encodeURIComponent(q)}`),
  fav: (movieId) => post('fav', { movie_id: movieId }),
  tick: (secs) => post('tick', { secs }),
  saveProfile: (fields) => post('profile_save', fields),
  verifyPin: (pin) => post('verify_pin', { pin }),
};

export const AGE_BANDS = [
  { id: '2-4', label: '2–4', sub: 'Little ones' },
  { id: '5-7', label: '5–7', sub: 'Big kids' },
  { id: '8-12', label: '8–12', sub: 'Pre-teens' },
];
export const LIMITS = [0, 15, 30, 45, 60, 90, 120];
export const KID_AVATARS = ['lion', 'fox', 'cat', 'bot', 'astro', 'ghost', 'popcorn', 'drum', 'gele-queen', 'afro-wave', 'nebula', 'sunset'];
export const KFONT = "'Nunito', 'Baloo 2', ui-rounded, system-ui, sans-serif";
export const KBG = 'radial-gradient(1200px 600px at 10% -10%, #3b1d6e 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #0e4a6b 0%, transparent 55%), #0b1026';
export const KCOLORS = ['#f472b6', '#38bdf8', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
