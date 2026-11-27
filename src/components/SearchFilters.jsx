import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import client from '../api/client';

export const EMPTY_FILTERS = { year: '', language: '', country: '', rating: '', sort: '' };
const SORTS = [{ id: '', label: 'Popular' }, { id: 'newest', label: 'Newest' }, { id: 'added', label: 'Recently added' }, { id: 'az', label: 'A–Z' }];
const COND = "'Barlow Condensed', sans-serif";

let facetCache = null;
export function useFacets() {
  const [f, setF] = useState(facetCache);
  useEffect(() => {
    if (facetCache) return;
    client.get('/movies.php?action=facets').then(r => { if (r.data?.ok) { facetCache = r.data; setF(r.data); } }).catch(() => {});
  }, []);
  return f;
}

export const activeCount = (f) => Object.entries(f).filter(([, v]) => v).length;
export const filterQuery = (f) => Object.entries(f).filter(([, v]) => v).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');
export const yearLabel = (y) => (y === 'older' ? 'Before 1980' : y);

function Chips({ title, options, value, onPick, fmt = (x) => x }) {
  if (!options?.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: '.66rem', letterSpacing: '.14em', color: 'rgba(255,255,255,.45)', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => {
          const id = typeof o === 'string' ? o : o.id; const label = typeof o === 'string' ? fmt(o) : o.label;
          const on = value === id;
          return (
            <button key={id || 'any'} onClick={() => onPick(on && id ? '' : id)} style={{
              padding: '8px 14px', borderRadius: 999, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
              background: on ? '#e50914' : 'rgba(255,255,255,.07)', color: '#fff', border: `1px solid ${on ? '#e50914' : 'rgba(255,255,255,.12)'}`, transition: 'background .15s',
            }}>{label}</button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSheet({ open, value, onApply, onClose }) {
  const facets = useFacets();
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  if (!open) return null;
  const set = (k) => (v) => setDraft(d => ({ ...d, [k]: v }));
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'sfFade .2s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '82vh', overflowY: 'auto', background: '#121214', borderRadius: '20px 20px 0 0', padding: '10px 18px calc(18px + env(safe-area-inset-bottom))', animation: 'sfUp .28s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: COND, fontSize: '1.35rem', fontWeight: 900 }}>Filters</span>
          <button onClick={() => setDraft(EMPTY_FILTERS)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: '.8rem', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
        </div>
        <Chips title="Sort by" options={SORTS} value={draft.sort} onPick={v => set('sort')(v)} />
        <Chips title="Release year" options={facets?.years} value={draft.year} onPick={set('year')} fmt={yearLabel} />
        <Chips title="Language" options={facets?.languages} value={draft.language} onPick={set('language')} />
        <Chips title="Country" options={facets?.countries} value={draft.country} onPick={set('country')} />
        <Chips title="Age rating" options={facets?.ratings} value={draft.rating} onPick={set('rating')} />
        {!facets && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.82rem', padding: '10px 0 20px' }}>Loading filters…</div>}
        <button onClick={() => { onApply(draft); onClose(); }} style={{ width: '100%', marginTop: 6, padding: '14px', borderRadius: 12, background: '#e50914', color: '#fff', border: 'none', fontWeight: 800, fontSize: '.95rem', cursor: 'pointer' }}>
          Show results{activeCount(draft) ? ` · ${activeCount(draft)} filter${activeCount(draft) > 1 ? 's' : ''}` : ''}
        </button>
      </div>
      <style>{'@keyframes sfFade{from{opacity:0}}@keyframes sfUp{from{transform:translateY(100%)}}'}</style>
    </div>,
    document.body,
  );
}
