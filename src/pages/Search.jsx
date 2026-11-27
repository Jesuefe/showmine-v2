import { useState, useEffect, useRef } from 'react';
import Icon, { IconBadge } from '../components/Icon';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { FilterSheet, EMPTY_FILTERS, activeCount, filterQuery, yearLabel } from '../components/SearchFilters';

const COND = "'Barlow Condensed', sans-serif";
const RECENT_KEY = 'sm_recent_searches';

const TILES = [
  { label: 'Nollywood', sub: 'Naija stories', genre: 'nollywood', bg: 'linear-gradient(135deg,#e50914,#5c0208)' },
  { label: 'International', sub: 'Hollywood · K-Drama', genre: 'international', bg: 'linear-gradient(135deg,#2563eb,#0b1f5c)' },
  { label: 'Sports', sub: 'Football & more', genre: 'sports', bg: 'linear-gradient(135deg,#16a34a,#06361a)' },
  { label: 'Documentaries', sub: 'Real Africa', genre: 'documentary', bg: 'linear-gradient(135deg,#9333ea,#2e0a52)' },
  { label: 'Faith', sub: 'Christian · Muslim', genre: 'religious', bg: 'linear-gradient(135deg,#f59e0b,#5c3a02)' },
  { label: 'Kids', sub: 'Cartoons & learning', genre: 'kids', bg: 'linear-gradient(135deg,#ec4899,#5a0b33)' },
];
const TYPES = [{ id: '', label: 'All' }, { id: 'movie', label: 'Movies' }, { id: 'series', label: 'Series' }];

function readRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
function saveRecent(list) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch { /* ignore */ } }

function Poster({ m, onClick }) {
  return (
    <div onClick={onClick} className="sr-press" style={{ cursor: 'pointer' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', background: '#161616', borderRadius: 10, overflow: 'hidden' }}>
        {m.cover_image
          ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: COND, fontWeight: 800, color: 'rgba(255,255,255,.3)', padding: 8, textAlign: 'center' }}>{m.title}</div>}
        {m.is_free && <span style={{ position: 'absolute', top: 6, left: 6, background: '#22c55e', color: '#fff', fontSize: '.5rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>FREE</span>}
      </div>
      <div style={{ fontSize: '.74rem', fontWeight: 700, padding: '5px 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
      <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.35)', padding: '0 2px' }}>{[m.release_year, (m.genre_names || '').split(',')[0]].filter(Boolean).join(' · ')}</div>
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [type, setType] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const [trending, setTrending] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const nFilters = activeCount(filters);
  const inputRef = useRef(null);

  useEffect(() => { if (!params.get('q')) inputRef.current?.focus(); }, [params]);

  useEffect(() => {
    client.get('/movies.php?action=home').then(r => { if (r.data.ok) setTrending((r.data.trending || []).slice(0, 8)); }).catch(() => {});
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term && !nFilters) return undefined;
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      client.get(`/movies.php?action=browse&q=${encodeURIComponent(term)}${type ? `&type=${type}` : ''}${filterQuery(filters)}`)
        .then(res => { if (alive && res.data.ok) setResults(res.data.movies || []); })
        .catch(() => {})
        .finally(() => { if (alive) { setLoading(false); setSearched(true); } });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [q, type, filters, nFilters]);

  const onChange = (v) => {
    setQ(v);
    if (!v.trim() && !nFilters) { setResults([]); setSearched(false); }
    setParams(v ? { q: v } : {}, { replace: true });
  };

  const open = (m) => {
    const term = q.trim();
    if (term) { const next = [term, ...recent.filter(r => r.toLowerCase() !== term.toLowerCase())]; setRecent(next); saveRecent(next); }
    navigate(`/watch/${m.slug}`);
  };

  const showDiscover = !q.trim() && !nFilters;

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px 16px 40px' }}>
      {/* Search bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#000', paddingBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.2" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input ref={inputRef} type="search" value={q} onChange={e => onChange(e.target.value)} enterKeyHint="search"
            placeholder="Movies, Nollywood, actors, sports…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '15px 44px 15px 48px', background: '#16161a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit' }} />
          {q && <button onClick={() => onChange('')} aria-label="Clear" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button onClick={() => setFiltersOpen(true)} aria-label="Filters" style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '7px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
            background: nFilters ? '#e50914' : 'rgba(255,255,255,.07)', color: '#fff', border: `1px solid ${nFilters ? '#e50914' : 'rgba(255,255,255,.12)'}`,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
            Filters{nFilters ? ` · ${nFilters}` : ''}
          </button>
          {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
            <button key={k} onClick={() => setFilters(f => ({ ...f, [k]: '' }))} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, fontSize: '.76rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(229,9,20,.12)', color: '#fff', border: '1px solid rgba(229,9,20,.35)' }}>
              {k === 'year' ? yearLabel(v) : k === 'sort' ? ({ newest: 'Newest', added: 'Recently added', az: 'A–Z' }[v] || v) : v}<Icon name="x" size={11} />
            </button>
          ))}
        </div>
        {!showDiscover && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
                background: type === t.id ? '#fff' : 'rgba(255,255,255,.07)', color: type === t.id ? '#000' : '#fff', border: '1px solid rgba(255,255,255,.12)',
              }}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {showDiscover ? (
        <>
          {recent.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: COND, fontSize: '1.05rem', fontWeight: 800 }}>Recent searches</span>
                <button onClick={() => { setRecent([]); saveRecent([]); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', fontSize: '.75rem', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recent.map(r => (
                  <button key={r} onClick={() => onChange(r)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: '.8rem', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontFamily: COND, fontSize: '1.05rem', fontWeight: 800, marginBottom: 10 }}>Explore African entertainment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 26 }}>
            {TILES.map(t => (
              <button key={t.genre} onClick={() => navigate(`/browse?genre=${t.genre}`)} className="sr-press" style={{
                position: 'relative', height: 86, borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'left', padding: '14px', overflow: 'hidden', color: '#fff', background: t.bg,
              }}>
                <span aria-hidden style={{ position: 'absolute', right: -16, bottom: -16, width: 70, height: 70, borderRadius: '50%', border: '10px solid rgba(255,255,255,.12)' }} />
                <span style={{ display: 'block', fontFamily: COND, fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: '.7rem', opacity: .75, marginTop: 4 }}>{t.sub}</span>
              </button>
            ))}
          </div>

          {trending.length > 0 && (
            <>
              <div style={{ fontFamily: COND, fontSize: '1.05rem', fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="flame" size={18} color="#e50914" /> Popular right now</div>
              {trending.map((m, i) => (
                <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} className="sr-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer' }}>
                  <span style={{ fontFamily: COND, fontSize: '1.5rem', fontWeight: 900, width: 26, color: i < 3 ? '#e50914' : 'rgba(255,255,255,.35)' }}>{i + 1}</span>
                  <div style={{ width: 100, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#161616', flexShrink: 0 }}>
                    {(m.banner_image || m.cover_image) && <img src={m.banner_image || m.cover_image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.86rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)' }}>{[m.release_year, (m.genre_names || '').split(',')[0]].filter(Boolean).join(' · ')}</div>
                  </div>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="rgba(255,255,255,.6)"/></svg>
                </div>
              ))}
            </>
          )}
        </>
      ) : loading && !results.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="sr-skel" style={{ aspectRatio: '2/3', borderRadius: 10 }} />)}
        </div>
      ) : searched && results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <IconBadge name="search" size={60} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 800 }}>{q.trim() ? `No results for “${q}”` : 'Nothing matches these filters'}</div>
          <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.5)', margin: '6px 0 18px' }}>Check the spelling, or try an actor, genre or language.</div>
          <button onClick={() => navigate('/browse')} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 800, cursor: 'pointer' }}>Browse all titles</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>{results.length} result{results.length !== 1 ? 's' : ''}{loading ? ' · updating…' : ''}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 12 }}>
            {results.map(m => <Poster key={m.id} m={m} onClick={() => open(m)} />)}
          </div>
        </>
      )}
      <FilterSheet open={filtersOpen} value={filters} onApply={setFilters} onClose={() => setFiltersOpen(false)} />
      <style>{`
        .sr-press{transition:transform .12s}.sr-press:active{transform:scale(.97)}
        @keyframes srSh{0%{background-position:-300px 0}100%{background-position:300px 0}}
        .sr-skel{background:linear-gradient(90deg,#111,#1c1c1c,#111);background-size:600px 100%;animation:srSh 1.2s linear infinite}
        input[type=search]::-webkit-search-cancel-button{display:none}
      `}</style>
    </div>
  );
}
