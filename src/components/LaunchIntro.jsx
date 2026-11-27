import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { tapHaptic } from '../utils/feel';

// Animated launch screen with sound. Runs once per app start in the native app
// (and on the web only with ?intro=1, for previewing). Tap anywhere to skip.
// The sound and animation share one timeline:
//   0.05s whoosh + halo draws · 0.45s shield draws · 1.05s IMPACT: fill flash,
//   shockwave · 1.15s play button springs in + chime · 1.5s wordmark ·
//   2.65s zoom through the logo into the app.

const HALO = 'M2650 6479 c-766 -76 -1436 -378 -1798 -813 -318 -382 -430 -816 -351 -1356 l12 -83 52 109 c390 819 1352 1346 2460 1347 1073 1 1955 -487 2434 -1348 68 -121 64 -123 81 30 120 1096 -685 1914 -2070 2101 -147 19 -669 28 -820 13z';
const SHIELD = 'M2080 4840 l-1054 -5 -507 -715 c-279 -393 -508 -718 -508 -721 -1 -3 91 -112 203 -242 113 -130 207 -241 210 -246 3 -5 0 -55 -8 -112 -35 -256 -28 -481 20 -699 157 -706 775 -1190 1877 -1470 l168 -43 266 -286 c146 -157 268 -287 272 -288 3 -1 121 129 261 287 l255 289 70 21 c824 245 1333 560 1632 1010 206 309 298 716 259 1145 l-8 80 251 284 c139 157 250 288 249 292 -2 4 -239 327 -528 718 l-525 711 -900 -3 c-495 -1 -1375 -4 -1955 -7z m2862 -979 c259 -375 297 -435 286 -450 -14 -17 -270 -318 -828 -971 -195 -228 -464 -543 -598 -700 -134 -157 -253 -290 -265 -297 -98 -52 -759 -68 -998 -25 -33 6 -115 98 -918 1015 -561 641 -879 1012 -874 1020 17 29 578 804 596 824 l19 22 1640 -2 1640 -2 300 -434z';
const PLAY = 'M2408 3945 c-53 -29 -53 -27 -53 -850 0 -817 0 -818 51 -852 57 -37 74 -30 831 365 392 204 728 382 747 397 65 50 70 99 13 152 -32 30 -1406 763 -1481 789 -48 17 -74 17 -108 -1z';

const TOTAL_MS = 3200;
const RED = '#e50914';

export function introSoundOn() {
  try { return localStorage.getItem('sm_intro_sound') !== '0'; } catch { return true; }
}
export function setIntroSound(on) {
  try { localStorage.setItem('sm_intro_sound', on ? '1' : '0'); } catch { /* ignore */ }
}

function shouldShow() {
  if (window.__smIntroShown) return false;
  const preview = /[?&]intro=1/.test(window.location.search);
  if (!Capacitor.isNativePlatform() && !preview) return false;
  try { if (sessionStorage.getItem('sm_intro_done') && !preview) return false; } catch { /* ignore */ }
  return true;
}

const CSS = `
.smi{position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-user-select:none;user-select:none}
.smi-out{animation:smiOut .55s cubic-bezier(.6,0,.3,1) forwards}
@keyframes smiOut{to{opacity:0}}
.smi-bg{position:absolute;inset:-20%;background:radial-gradient(circle at 50% 46%,rgba(229,9,20,.0),transparent 40%);animation:smiBg 3.2s ease both}
@keyframes smiBg{0%{background:radial-gradient(circle at 50% 46%,rgba(229,9,20,0),transparent 40%)}33%{background:radial-gradient(circle at 50% 46%,rgba(229,9,20,.55),rgba(80,0,4,.25) 30%,transparent 60%)}60%{background:radial-gradient(circle at 50% 46%,rgba(229,9,20,.28),rgba(60,0,3,.15) 35%,transparent 65%)}100%{background:radial-gradient(circle at 50% 46%,rgba(229,9,20,.2),transparent 60%)}}
.smi-rays{position:absolute;left:50%;top:44%;width:180vmax;height:180vmax;margin:-90vmax 0 0 -90vmax;background:repeating-conic-gradient(from 0deg,rgba(229,9,20,.10) 0deg 3deg,transparent 3deg 14deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 45%);mask:radial-gradient(circle,#000 0,transparent 45%);animation:smiRays 3.2s linear both}
@keyframes smiRays{0%{opacity:0;transform:rotate(0) scale(.6)}30%{opacity:0}36%{opacity:1}100%{opacity:.5;transform:rotate(25deg) scale(1)}}
.smi-stage{position:relative;display:flex;flex-direction:column;align-items:center;animation:smiZoom 3.2s cubic-bezier(.7,0,.2,1) both}
@keyframes smiZoom{0%,82%{transform:scale(1);opacity:1}100%{transform:scale(9) translateY(1.5%);opacity:0}}
.smi-logo{width:min(34vw,170px);height:auto;overflow:visible;animation:smiShake .5s ease 1.05s forwards}
@keyframes smiShake{0%{transform:scale(1.12)}20%{transform:scale(.96) translate(2px,-1px)}40%{transform:scale(1.03) translate(-2px,1px)}70%{transform:scale(.995)}100%{transform:scale(1)}}
.smi-draw{fill:transparent;stroke:${RED};stroke-width:42;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}
.smi-halo{animation:smiDraw .75s cubic-bezier(.6,.1,.3,1) .05s both,smiFill .35s ease 1.02s forwards}
.smi-shield{animation:smiDraw .62s cubic-bezier(.6,.1,.3,1) .42s both,smiFill .3s ease 1.02s forwards}
@keyframes smiDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes smiFill{0%{fill:#fff;stroke:#fff;filter:drop-shadow(0 0 0 #fff)}40%{fill:#ff5a5f;stroke:#ff5a5f}100%{fill:${RED};stroke:${RED}}}
.smi-play{transform-box:fill-box;transform-origin:35% 50%;animation:smiPlay .7s cubic-bezier(.3,1.7,.5,1) 1.12s both}
@keyframes smiPlay{0%{transform:scale(0) rotate(-40deg);fill:#fff}55%{fill:#fff}100%{transform:scale(1) rotate(0);fill:${RED}}}
.smi-glow{filter:drop-shadow(0 0 10px rgba(229,9,20,.0));animation:smiGlow 2.2s ease 1.0s both}
@keyframes smiGlow{0%{filter:drop-shadow(0 0 0 rgba(229,9,20,0))}12%{filter:drop-shadow(0 0 28px rgba(255,60,60,1))}100%{filter:drop-shadow(0 0 14px rgba(229,9,20,.55))}}
.smi-ring{position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px;border-radius:50%;border:3px solid rgba(255,90,90,.9);opacity:0;animation:smiRing .9s cubic-bezier(.1,.6,.3,1) 1.05s forwards}
.smi-ring.r2{animation-delay:1.18s;border-color:rgba(255,255,255,.6);border-width:2px}
@keyframes smiRing{0%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(4.2)}}
.smi-word{margin-top:22px;display:flex;font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:900;font-size:min(9vw,40px);color:#fff;letter-spacing:.14em;padding-left:.14em}
.smi-word span{display:inline-block;animation:smiLetter .55s cubic-bezier(.2,1.4,.4,1) both}
@keyframes smiLetter{from{opacity:0;transform:translateY(60%) scale(.6);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.smi-sweep{position:relative;overflow:hidden}
.smi-sweep::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:overlay;animation:smiSweep .8s ease 2.0s both}
@keyframes smiSweep{from{left:-60%}to{left:120%}}
.smi-tag{margin-top:8px;font-family:'Barlow',system-ui,sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.42em;padding-left:.42em;color:rgba(255,255,255,.55);text-transform:uppercase;animation:smiTag .6s ease 1.95s both}
@keyframes smiTag{from{opacity:0;letter-spacing:.9em}to{opacity:1;letter-spacing:.42em}}
.smi-dust{position:absolute;width:3px;height:3px;border-radius:50%;background:rgba(255,120,120,.9);box-shadow:0 0 6px rgba(255,60,60,.9);opacity:0}
@keyframes smiDust{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}
.smi-skip{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom));right:20px;font:700 .65rem 'Barlow',sans-serif;letter-spacing:.2em;color:rgba(255,255,255,.3);animation:smiTag .5s ease .8s both}
@media (prefers-reduced-motion: reduce){.smi *{animation-duration:.01ms!important;animation-delay:0s!important}}
`;

const DUST = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.3;
  const d = 120 + (i * 37) % 160;
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, delay: 1.05 + (i % 6) * 0.03, dur: 0.9 + (i % 5) * 0.18 };
});

export default function LaunchIntro() {
  const [show] = useState(shouldShow);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const audioRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!show) return;
    window.__smIntroShown = true;
    try { sessionStorage.setItem('sm_intro_done', '1'); } catch { /* ignore */ }
    // Hand over from the static native splash to this screen in the same frame.
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});

    if (introSoundOn()) {
      const a = new Audio('/intro.mp3');
      a.volume = 0.9;
      audioRef.current = a;
      a.play().catch(() => { /* autoplay refused: run silently */ });
    }
    const hit = setTimeout(() => tapHaptic('heavy'), 1050);
    const hit2 = setTimeout(() => tapHaptic('light'), 1180);
    const end = setTimeout(finish, TOTAL_MS - 450);
    return () => { clearTimeout(hit); clearTimeout(hit2); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    const a = audioRef.current;
    if (a && !a.paused) {
      // gentle fade instead of a hard cut when skipped early
      const step = setInterval(() => {
        a.volume = Math.max(0, a.volume - 0.08);
        if (a.volume <= 0.01) { a.pause(); clearInterval(step); }
      }, 40);
    }
    setTimeout(() => setGone(true), 560);
  }

  if (!show || gone) return null;

  return (
    <div className={`smi${leaving ? ' smi-out' : ''}`} onClick={finish} role="presentation" aria-label="Showmine">
      <style>{CSS}</style>
      <div className="smi-bg" />
      <div className="smi-rays" />
      <div className="smi-stage">
        <div style={{ position: 'relative' }}>
          <div className="smi-ring" />
          <div className="smi-ring r2" />
          {DUST.map((p, i) => (
            <span key={i} className="smi-dust" style={{ left: '50%', top: '50%', '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animation: `smiDust ${p.dur}s cubic-bezier(.1,.7,.3,1) ${p.delay}s both` }} />
          ))}
          <svg className="smi-logo smi-glow" viewBox="0 0 600 650" aria-hidden>
            <g transform="translate(0 650) scale(.1 -.1)">
              <path className="smi-draw smi-halo" d={HALO} pathLength="1" />
              <path className="smi-draw smi-shield" d={SHIELD} pathLength="1" fillRule="evenodd" />
              <path className="smi-play" d={PLAY} fill={RED} />
            </g>
          </svg>
        </div>
        <div className="smi-sweep">
          <div className="smi-word">
            {'SHOWMINE'.split('').map((c, i) => (
              <span key={i} style={{ animationDelay: `${1.45 + i * 0.055}s` }}>{c}</span>
            ))}
          </div>
        </div>
        <div className="smi-tag">Movies · Series · Live</div>
      </div>
      <div className="smi-skip">TAP TO SKIP</div>
    </div>
  );
}
