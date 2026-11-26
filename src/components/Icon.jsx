// Showmine line-icon set: one consistent 24px grid, rounded 1.8 stroke, currentColor.
// Usage: <Icon name="shield" size={20} color="#e50914" />
const P = {
  shield: <path d="M12 3l8 3v6c0 4.6-3.3 8.4-8 9-4.7-.6-8-4.4-8-9V6l8-3z" />,
  shieldCheck: <><path d="M12 3l8 3v6c0 4.6-3.3 8.4-8 9-4.7-.6-8-4.4-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 018 0v3" /></>,
  unlock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 017.6-1.7" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l2.5 2.5M14.5 8.5l2 2" /></>,
  message: <path d="M4 5.5h16a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H10l-4.5 3.5V17.5H4A1.5 1.5 0 012.5 16V7A1.5 1.5 0 014 5.5z" />,
  messageOff: <><path d="M4 5.5h16a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H10l-4.5 3.5V17.5H4A1.5 1.5 0 012.5 16V7A1.5 1.5 0 014 5.5z" /><path d="M3 3l18 18" /></>,
  palette: <><path d="M12 3a9 9 0 000 18c1.1 0 1.8-.9 1.5-1.9-.4-1.3.5-2.6 1.9-2.6H17a4 4 0 004-4c0-5-4-9.5-9-9.5z" /><circle cx="7.5" cy="11" r="1.1" /><circle cx="10" cy="7" r="1.1" /><circle cx="15" cy="7.5" r="1.1" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />,
  book: <><path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" /><path d="M4 20a2 2 0 002 2h13v-4" /><path d="M9 7h6" /></>,
  puzzle: <path d="M9 4h3.5a2 2 0 114 0H19v4.5a2 2 0 110 4V17h-4.5a2 2 0 10-4 0H6v-4.5a2 2 0 100-4V4h3z" />,
  film: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21" /></>,
  clapper: <><path d="M3.5 10h17v9a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19v-9z" /><path d="M3.5 10l-.6-3.3a1.5 1.5 0 011.2-1.7l13.4-2.4a1.5 1.5 0 011.7 1.2l.6 3.2L3.5 10zM8 4.7l2.3 3.5M13 3.8l2.3 3.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4L12 7.5zM12 3v4.5M20.6 9.5l-4.8.8M17.4 19.3l-3.1-4.6M6.6 19.3l3.1-4.6M3.4 9.5l4.8.8" /></>,
  video: <><rect x="2.5" y="6" width="13.5" height="12" rx="2.5" /><path d="M16 10.5l5.5-3v9l-5.5-3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" /><circle cx="9" cy="9.8" r=".9" fill="currentColor" /><circle cx="15" cy="9.8" r=".9" fill="currentColor" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20.5c1.2-3.8 4.3-5.8 8-5.8s6.8 2 8 5.8" /></>,
  userX: <><circle cx="10" cy="8" r="4" /><path d="M2.5 20.5c1.1-3.6 3.9-5.6 7.5-5.6 1.6 0 3 .4 4.2 1.1M16.5 15.5l5 5M21.5 15.5l-5 5" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 102.5-6" /><path d="M3 4v4h4" /><path d="M12 7.5V12l3 2" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.2a4.3 4.3 0 017.5 2.6C19.5 15.4 12 20 12 20z" />,
  bell: <><path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15l1.5-2z" /><path d="M10 21h4" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  vibrate: <><rect x="7.5" y="4" width="9" height="16" rx="2" /><path d="M4 8v8M20 8v8M1.5 10v4M22.5 10v4" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.8" /><path d="M5.6 5.6l3.7 3.7M14.7 14.7l3.7 3.7M18.4 5.6l-3.7 3.7M9.3 14.7l-3.7 3.7" /></>,
  wave: <><path d="M7 11.5V6.5a1.5 1.5 0 013 0V11M10 10.5V4.5a1.5 1.5 0 013 0v6M13 10.5V5.5a1.5 1.5 0 013 0v6M16 11.5V8a1.5 1.5 0 013 0v5.5a7.5 7.5 0 01-7.5 7.5h-.6a6.5 6.5 0 01-5.4-2.9L3 13.5a1.6 1.6 0 012.5-2l1.5 1.6" /></>,
  alert: <><path d="M10.3 4.2L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.8 2.8L16.5 9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5l-4.6-4.6" /></>,
  flame: <path d="M12 21.5c-3.9 0-7-2.8-7-6.7 0-3.3 2.2-5.5 3.7-7.3.4-.5 1.2-.2 1.2.5 0 1.4 1 2.4 2.1 2.4 0-3 1.4-5.6 3.2-7.4.4-.4 1.1-.1 1.1.5 0 2.3 2.7 4.6 2.7 8.9 0 4.6-3.1 9.1-7 9.1z" />,
  broadcast: <><circle cx="12" cy="12" r="2" /><path d="M8.2 8.2a5.4 5.4 0 000 7.6M15.8 8.2a5.4 5.4 0 010 7.6M5.4 5.4a9.3 9.3 0 000 13.2M18.6 5.4a9.3 9.3 0 010 13.2" /></>,
  zap: <path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12l1-8z" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  clipboard: <><rect x="5" y="4.5" width="14" height="17" rx="2" /><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 14h7M8.5 18h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6" /></>,
  handshake: <><path d="M2.5 11.5l4-4 3 1 3-2 4 .5 5 4.5" /><path d="M21.5 11.5l-5.5 5.5a1.6 1.6 0 01-2.3 0l-.5-.5M13 16.5l-1.5 1.5a1.6 1.6 0 01-2.3 0L4 12.8M12.5 6.5L9 10a1.6 1.6 0 002.3 2.3l2.2-2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  cookie: <><path d="M20.8 12.6A9 9 0 1111.4 3.2a3 3 0 003.8 3.7 3 3 0 005.6 5.7z" /><circle cx="8.5" cy="10" r=".9" fill="currentColor" /><circle cx="13" cy="15" r=".9" fill="currentColor" /><circle cx="8.5" cy="15.5" r=".9" fill="currentColor" /></>,
  fileText: <><path d="M14 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V8l-5-5z" /><path d="M14 3v5h5M8.5 13h7M8.5 17h5" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 015.2-.4l-2.9 2.9.7 2.1 2.1.7 2.9-2.9a4 4 0 01-5.4 5.3L8.4 22.9a2 2 0 01-2.8 0L4.1 21.4a2 2 0 010-2.8l8.8-8.9a4 4 0 011.8-3.4z" />,
  megaphone: <><path d="M3.5 10v4a1 1 0 001 1H7l7 4.5v-15L7 9H4.5a1 1 0 00-1 1z" /><path d="M18 9a4 4 0 010 6M7 15l1.5 5h2.5l-1-5" /></>,
  volume: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" /><path d="M15.5 9a4.2 4.2 0 010 6M18.5 6.5a8 8 0 010 11" /></>,
  volumeX: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  eyeOff: <><path d="M3 3l18 18M10.6 5.2A9.9 9.9 0 0112 5c5.5 0 9 5.5 9.5 7-.3.8-1.3 2.6-3 4.2M6.6 6.7C4.3 8.2 2.9 10.6 2.5 12c.5 1.5 4 7 9.5 7 1.6 0 3-.4 4.3-1.1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
  tv: <><rect x="2.5" y="5" width="19" height="13" rx="2.5" /><path d="M8 21h8M12 18v3" /></>,
  cast: <><path d="M3 17a4 4 0 014 4M3 13a8 8 0 018 8M3 9.2V6.5A2 2 0 015 4.5h14a2 2 0 012 2v11a2 2 0 01-2 2h-5" /></>,
};

export default function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8, style, ...rest }) {
  const body = P[name] || P.star;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block', ...style }} {...rest}>
      {body}
    </svg>
  );
}

// Rounded tile holding an icon — the "mature" replacement for big emoji headers.
export function IconBadge({ name, size = 52, color = '#e50914', bg, iconSize, style }) {
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg || `${color}1f`, border: `1px solid ${color}40`, color, flexShrink: 0, ...style }}>
      <Icon name={name} size={iconSize || Math.round(size * 0.48)} />
    </div>
  );
}
