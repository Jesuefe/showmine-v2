import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KFONT, KBG } from './api';
import { tapHaptic, successHaptic } from '../utils/feel';

// Tiny learning games for Kids Mode: counting, colours and shapes.
// Sounds are synthesised with Web Audio; prompts are read aloud when the phone supports it.

let ctx;
function tone(freqs, dur = 0.14, type = 'sine', gap = 0.09, vol = 0.18) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      const t = ctx.currentTime + i * gap;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
    });
  } catch { /* no audio */ }
}
const yay = () => tone([523, 659, 784, 1046], 0.22, 'triangle', 0.09);
const oops = () => tone([300, 220], 0.2, 'sine', 0.12, 0.12);
const pop = () => tone([880], 0.08, 'square', 0, 0.06);
function say(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 1.25;
    window.speechSynthesis.speak(u);
  } catch { /* unsupported */ }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

const COLORS = [
  { name: 'red', hex: '#ef4444' }, { name: 'blue', hex: '#3b82f6' }, { name: 'yellow', hex: '#facc15' },
  { name: 'green', hex: '#22c55e' }, { name: 'purple', hex: '#a855f7' }, { name: 'orange', hex: '#f97316' }, { name: 'pink', hex: '#ec4899' },
];
const SHAPES = {
  circle: <circle cx="50" cy="50" r="38" />,
  square: <rect x="14" y="14" width="72" height="72" rx="8" />,
  triangle: <path d="M50 10 L92 86 H8Z" />,
  star: <path d="M50 6 l12 28 30 2 -23 19 8 30 -27 -17 -27 17 8 -30 -23 -19 30 -2Z" />,
  heart: <path d="M50 88 C10 60 6 34 22 22 c12 -9 24 -3 28 8 c4 -11 16 -17 28 -8 c16 12 12 38 -28 66Z" />,
  diamond: <path d="M50 6 L90 50 L50 94 L10 50Z" />,
};

const GAMES = [
  { id: 'count', title: 'Count the Stars', color: '#facc15', icon: 'star' },
  { id: 'colors', title: 'Colour Pop', color: '#f472b6', icon: 'palette' },
  { id: 'shapes', title: 'Shape Hunt', color: '#38bdf8', icon: 'shape' },
];

function makeRound(game) {
  if (game === 'count') {
    const n = 1 + Math.floor(Math.random() * 9);
    const opts = shuffle([n, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== n)).slice(0, 2)]);
    return { prompt: 'How many stars?', answer: n, options: opts, n };
  }
  if (game === 'colors') {
    const target = pick(COLORS);
    const opts = shuffle([target, ...shuffle(COLORS.filter(c => c !== target)).slice(0, 3)]);
    return { prompt: `Pop the ${target.name} balloon!`, answer: target.name, options: opts };
  }
  const names = Object.keys(SHAPES);
  const target = pick(names);
  const colors = shuffle(COLORS);
  const opts = shuffle([target, ...shuffle(names.filter(s => s !== target)).slice(0, 3)]).map((s, i) => ({ s, c: colors[i].hex }));
  return { prompt: `Find the ${target}!`, answer: target, options: opts };
}

function Confetti({ k }) {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    x: (i * 29) % 100, d: 0.6 + (i % 7) * 0.12, c: ['#facc15', '#f472b6', '#38bdf8', '#4ade80', '#a78bfa', '#fb923c'][i % 6], r: (i * 47) % 360, s: 6 + (i % 4) * 3,
  })), []);
  return (
    <div key={k} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {bits.map((b, i) => <span key={i} style={{ position: 'absolute', left: `${b.x}%`, top: -20, width: b.s, height: b.s * 1.6, background: b.c, borderRadius: 2, transform: `rotate(${b.r}deg)`, animation: `plFall ${b.d + 0.8}s cubic-bezier(.3,.6,.5,1) ${i * 0.015}s forwards` }} />)}
    </div>
  );
}

function Game({ game, onExit }) {
  const [round, setRound] = useState(() => makeRound(game.id));
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [cheer, setCheer] = useState(0);
  const [done, setDone] = useState(false);
  const lock = useRef(false);

  useEffect(() => { say(round.prompt); }, [round]);

  const choose = (value, idx) => {
    if (lock.current) return;
    if (value === round.answer) {
      lock.current = true; yay(); successHaptic(); setCheer(c => c + 1);
      const s = score + 1; setScore(s);
      setTimeout(() => {
        lock.current = false;
        if (s >= 5) { setDone(true); say('You did it! Amazing!'); tone([523, 659, 784, 1046, 1318], 0.3, 'triangle', 0.12); }
        else setRound(makeRound(game.id));
      }, 900);
    } else {
      oops(); tapHaptic('medium'); setWrong(idx); setTimeout(() => setWrong(null), 500);
    }
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'plIn .5s ease both' }}>
      <Confetti k="end" />
      <div style={{ fontSize: 0, marginBottom: 10 }}>
        {[0, 1, 2, 3, 4].map(i => <svg key={i} width="44" height="44" viewBox="0 0 100 100" style={{ animation: `plPop .5s cubic-bezier(.3,1.6,.5,1) ${i * .12}s both` }}><g fill="#facc15">{SHAPES.star}</g></svg>)}
      </div>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '6px 0' }}>Amazing!</h2>
      <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '1.05rem' }}>You got all 5 stars in {game.title}!</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
        <button onClick={() => { setScore(0); setDone(false); setRound(makeRound(game.id)); }} style={bigBtn(game.color)}>Play again</button>
        <button onClick={onExit} style={{ ...bigBtn('rgba(255,255,255,.12)'), color: '#fff' }}>More games</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '6px 20px 30px' }}>
      {cheer > 0 && <Confetti k={cheer} />}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <svg key={i} width="30" height="30" viewBox="0 0 100 100" style={{ transition: 'transform .3s', transform: i < score ? 'scale(1.15)' : 'scale(1)' }}>
            <g fill={i < score ? '#facc15' : 'rgba(255,255,255,.15)'}>{SHAPES.star}</g>
          </svg>
        ))}
      </div>
      <button onClick={() => say(round.prompt)} style={{ display: 'block', margin: '0 auto 18px', background: 'none', border: 'none', color: '#fff', fontFamily: KFONT, fontSize: '1.6rem', fontWeight: 900, cursor: 'pointer', textAlign: 'center' }}>
        {round.prompt} <span style={{ fontSize: '1rem', opacity: .6 }}>🔊</span>
      </button>

      {game.id === 'count' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 360, margin: '0 auto 24px', minHeight: 130 }}>
          {Array.from({ length: round.n }).map((_, i) => (
            <svg key={`${round.n}-${i}`} width="54" height="54" viewBox="0 0 100 100" onClick={pop} style={{ animation: `plPop .45s cubic-bezier(.3,1.6,.5,1) ${i * .07}s both, plBob 2s ease-in-out ${i * .2}s infinite` }}>
              <g fill="#facc15" stroke="#f59e0b" strokeWidth="4">{SHAPES.star}</g>
            </svg>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: game.id === 'count' ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 14, maxWidth: 420, margin: '0 auto' }}>
        {round.options.map((o, i) => {
          const shake = wrong === i ? 'plShake .45s ease' : `plPop .4s cubic-bezier(.3,1.6,.5,1) ${i * .06}s both`;
          if (game.id === 'count') return (
            <button key={i} onClick={() => choose(o, i)} style={{ ...bigBtn(['#38bdf8', '#4ade80', '#f472b6'][i]), fontSize: '2.2rem', padding: '18px 0', animation: shake }}>{o}</button>
          );
          if (game.id === 'colors') return (
            <button key={i} onClick={() => choose(o.name, i)} aria-label={o.name} style={{ background: 'none', border: 'none', cursor: 'pointer', animation: shake }}>
              <svg viewBox="0 0 100 130" style={{ width: '100%', maxWidth: 130, animation: `plBob ${2 + i * .3}s ease-in-out infinite` }}>
                <ellipse cx="50" cy="50" rx="38" ry="46" fill={o.hex} />
                <ellipse cx="36" cy="32" rx="9" ry="14" fill="#fff" opacity=".35" />
                <path d="M46 95 h8 l-4 7z" fill={o.hex} />
                <path d="M50 102 q-6 12 2 26" stroke="rgba(255,255,255,.6)" strokeWidth="2" fill="none" />
              </svg>
            </button>
          );
          return (
            <button key={i} onClick={() => choose(o.s, i)} aria-label={o.s} style={{ background: 'rgba(255,255,255,.07)', border: '2px solid rgba(255,255,255,.12)', borderRadius: 24, padding: 14, cursor: 'pointer', animation: shake }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 110 }}><g fill={o.c}>{SHAPES[o.s]}</g></svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const bigBtn = (bg) => ({ background: bg, color: '#1a1033', border: 'none', borderRadius: 20, padding: '14px 22px', fontWeight: 900, fontFamily: KFONT, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,.25)' });

export default function PlayLearn() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: KBG, fontFamily: KFONT, color: '#fff', paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}>
      <style>{`
        @keyframes plPop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}
        @keyframes plBob{0%,100%{translate:0 0}50%{translate:0 -6px}}
        @keyframes plShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
        @keyframes plFall{to{transform:translateY(110vh) rotate(720deg)}}
        @keyframes plIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 10px' }}>
        <button onClick={() => (game ? setGame(null) : navigate('/kids'))} aria-label="Back" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{game ? game.title : 'Play & Learn'}</h1>
      </div>

      {game ? <Game key={game.id} game={game} onExit={() => setGame(null)} /> : (
        <div style={{ display: 'grid', gap: 14, padding: '8px 20px 40px', maxWidth: 520, margin: '0 auto' }}>
          {GAMES.map((g, i) => (
            <button key={g.id} onClick={() => { pop(); setGame(g); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 26, border: `3px solid ${g.color}`, background: `linear-gradient(135deg, ${g.color}33, rgba(255,255,255,.03))`, color: '#fff', cursor: 'pointer', fontFamily: KFONT, textAlign: 'left', animation: `plIn .45s ease ${i * .08}s both` }}>
              <div style={{ width: 70, height: 70, borderRadius: 22, background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="44" height="44" viewBox="0 0 100 100"><g fill="#1a1033">{g.id === 'count' ? SHAPES.star : g.id === 'colors' ? <><ellipse cx="50" cy="42" rx="28" ry="34" /><path d="M46 78 h8 l-4 6z" /></> : <>{SHAPES.triangle}</>}</g></svg>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{g.title}</div>
                <div style={{ fontSize: '.85rem', opacity: .7, fontWeight: 700 }}>{g.id === 'count' ? 'Numbers 1 to 10' : g.id === 'colors' ? 'Learn your colours' : 'Circles, stars and more'}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
