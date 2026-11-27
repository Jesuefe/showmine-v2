import { AvatarArt } from '../components/Avatar';
import { AGE_BANDS, LIMITS, KID_AVATARS, KFONT } from './api';

const label = { fontSize: '.78rem', fontWeight: 800, color: 'rgba(255,255,255,.6)', margin: '18px 0 8px', textTransform: 'uppercase', letterSpacing: '.08em' };
const chip = (on, color = '#facc15') => ({
  padding: '10px 14px', borderRadius: 14, border: `2px solid ${on ? color : 'rgba(255,255,255,.12)'}`,
  background: on ? color : 'rgba(255,255,255,.05)', color: on ? '#1a1033' : '#fff', fontWeight: 900,
  fontFamily: KFONT, cursor: 'pointer', fontSize: '.92rem', transition: 'all .2s',
});

// Child profile + rules. `value` is the profile object; `onChange(next)` receives the full object.
export default function KidProfileForm({ value, onChange, compact }) {
  const v = value;
  const set = (k, x) => onChange({ ...v, [k]: x });
  const bed = !!(v.bedtime_start && v.bedtime_end);
  const avatar = v.avatar || KID_AVATARS[0];

  return (
    <div style={{ fontFamily: KFONT, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AvatarArt style={avatar} size={64} radius={20} />
        <div style={{ flex: 1 }}>
          <div style={{ ...label, margin: '0 0 6px' }}>Child’s name</div>
          <input value={v.child_name || ''} onChange={e => set('child_name', e.target.value.slice(0, 30))} placeholder="e.g. Amara"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '2px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: '1.05rem', fontWeight: 800, fontFamily: KFONT, outline: 'none' }} />
        </div>
      </div>

      <div style={label}>Pick a buddy</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 6 : 6}, 1fr)`, gap: 8 }}>
        {KID_AVATARS.map(a => (
          <button key={a} type="button" onClick={() => set('avatar', a)} aria-label={a} data-nohaptic style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 14, outline: avatar === a ? '3px solid #facc15' : 'none', outlineOffset: 2 }}>
            <AvatarArt style={a} size="100%" radius={14} styleProp={{ width: '100%', height: 'auto', aspectRatio: '1/1' }} />
          </button>
        ))}
      </div>

      <div style={label}>Age</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {AGE_BANDS.map(b => (
          <button key={b.id} type="button" onClick={() => set('age_band', b.id)} style={{ ...chip(v.age_band === b.id, '#38bdf8'), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '1.1rem' }}>{b.label}</span>
            <span style={{ fontSize: '.68rem', fontWeight: 700, opacity: .75 }}>{b.sub}</span>
          </button>
        ))}
      </div>

      <div style={label}>Daily screen time</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {LIMITS.map(m => (
          <button key={m} type="button" onClick={() => set('daily_limit_mins', m)} style={chip(Number(v.daily_limit_mins || 0) === m, '#4ade80')}>
            {m === 0 ? 'No limit' : m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`}
          </button>
        ))}
      </div>

      <div style={{ ...label, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Bedtime lock</span>
        <button type="button" role="switch" aria-checked={bed} onClick={() => onChange({ ...v, bedtime_start: bed ? null : '20:00', bedtime_end: bed ? null : '07:00' })} style={{
          width: 50, height: 28, borderRadius: 28, border: 'none', cursor: 'pointer', position: 'relative', background: bed ? '#a78bfa' : 'rgba(255,255,255,.15)', transition: 'background .2s' }}>
          <span style={{ position: 'absolute', top: 3, left: bed ? 25 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .25s cubic-bezier(.3,1.5,.5,1)' }} />
        </button>
      </div>
      {bed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.3)', borderRadius: 14, padding: '10px 12px' }}>
          <span style={{ fontSize: '.85rem', fontWeight: 800 }}>From</span>
          <input type="time" value={v.bedtime_start} onChange={e => set('bedtime_start', e.target.value)} style={timeInput} />
          <span style={{ fontSize: '.85rem', fontWeight: 800 }}>to</span>
          <input type="time" value={v.bedtime_end} onChange={e => set('bedtime_end', e.target.value)} style={timeInput} />
        </div>
      )}
    </div>
  );
}

const timeInput = { flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(0,0,0,.3)', color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: KFONT, colorScheme: 'dark' };
