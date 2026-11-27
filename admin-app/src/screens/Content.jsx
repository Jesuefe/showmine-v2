import { useState } from 'react';
import { api } from '../api';
import { C, COND, Card, Chip, SearchBar, Loading, ErrorBox, Empty, Badge, Sheet, Toggle, Input, TextArea, Btn, H, toast, confirmDialog, useApi, compact, secs, parseSecs } from '../ui';

const TYPES = [{ id: '', label: 'All' }, { id: 'movie', label: 'Movies' }, { id: 'series', label: 'Series' }, { id: 'kids', label: 'Kids' }, { id: 'cc', label: 'Free Cinema' }];
const STATUS = [{ id: '', label: 'Any status' }, { id: 'active', label: 'Live' }, { id: 'hidden', label: 'Hidden' }];

export default function Content() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload, setData } = useApi('content_list', { q, type, status, page });

  const quickToggle = async (m, field) => {
    const v = m[field] ? 0 : 1;
    setData(d => ({ ...d, items: d.items.map(x => x.id === m.id ? { ...x, [field]: v } : x) }));
    try { await api.post('content_save', { id: m.id, [field]: v }); toast(`${m.title}: ${field === 'is_active' ? (v ? 'now live' : 'hidden') : (v ? 'featured' : 'unfeatured')}`); }
    catch (e) { toast(e.message, 'err'); reload(); }
  };

  return (
    <div>
      <div style={{ position: 'sticky', top: 'calc(env(safe-area-inset-top) + 62px)', zIndex: 10, background: C.bg, padding: '12px 0 8px' }}>
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search titles…" />
        <div className="hscroll" style={{ marginTop: 10 }}>
          {TYPES.map(t => <Chip key={t.id} on={type === t.id} onClick={() => { setType(t.id); setPage(1); }}>{t.label}</Chip>)}
          <span style={{ width: 1, background: C.line, flexShrink: 0 }} />
          {STATUS.map(t => <Chip key={t.id} on={status === t.id} onClick={() => { setStatus(t.id); setPage(1); }}>{t.label}</Chip>)}
        </div>
      </div>
      {loading && !data ? <Loading /> : error && !data ? <ErrorBox error={error} retry={reload} /> : (
        <>
          <div style={{ fontSize: '.74rem', color: C.faint, margin: '4px 2px 10px' }}>{data.total} titles{loading ? ' · updating…' : ''}</div>
          {data.items.length === 0 && <Empty>No titles match.</Empty>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.items.map(m => (
              <Card key={m.id} style={{ display: 'flex', gap: 12, padding: 10, alignItems: 'center', opacity: m.is_active ? 1 : .6 }}>
                <div onClick={() => setOpen(m.id)} className="press" style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer', alignItems: 'center' }}>
                  {m.cover_image ? <img src={m.cover_image} alt="" loading="lazy" style={{ width: 46, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 46, height: 66, borderRadius: 8, background: C.card2, flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ fontSize: '.72rem', color: C.faint, margin: '3px 0 6px' }}>#{m.id} · {m.content_type}{m.release_year ? ` · ${m.release_year}` : ''} · {compact(m.view_count)} views</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {m.is_active ? <Badge color={C.green}>Live</Badge> : <Badge>Hidden</Badge>}
                      {!!m.is_featured && <Badge color={C.amber}>Featured</Badge>}
                      {!!m.is_free && <Badge color={C.blue}>Free</Badge>}
                      {!!m.is_kids && <Badge color="#a855f7">Kids</Badge>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <IconBtn on={!!m.is_active} onClick={() => quickToggle(m, 'is_active')} title={m.is_active ? 'Hide' : 'Publish'}>
                    {m.is_active ? <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z" /> : <path d="M2 5l17 17M12 5c-7 0-10 7-10 7a17 17 0 004 4.6M9.9 5.2A10 10 0 0112 5c7 0 10 7 10 7a17 17 0 01-2.3 3.3" fill="none" stroke="currentColor" strokeWidth="2" />}
                  </IconBtn>
                  <IconBtn on={!!m.is_featured} onClick={() => quickToggle(m, 'is_featured')} title="Feature"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></IconBtn>
                </div>
              </Card>
            ))}
          </div>
          <Pager page={page} total={data.total} per={30} onPage={setPage} />
        </>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Edit title" full>
        {open && <Editor id={open} onSaved={reload} />}
      </Sheet>
    </div>
  );
}

const IconBtn = ({ on, onClick, children, title }) => (
  <button onClick={onClick} title={title} aria-label={title} className="press" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.line}`, background: on ? 'rgba(229,9,20,.15)' : C.card2, color: on ? C.red : C.faint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">{children}</svg>
  </button>
);

export function Pager({ page, total, per, onPage }) {
  const pages = Math.ceil(total / per);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <Btn kind="ghost" small disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</Btn>
      <span style={{ fontSize: '.8rem', color: C.dim }}>Page {page} of {pages}</span>
      <Btn kind="ghost" small disabled={page >= pages} onClick={() => onPage(page + 1)}>Next ›</Btn>
    </div>
  );
}

function Editor({ id, onSaved }) {
  const { data, error, loading, reload } = useApi('content_get', { id });
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ep, setEp] = useState(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const m = data.item;
  const form = f || {
    title: m.title || '', description: m.description || '', release_year: m.release_year || '', age_rating: m.age_rating || '', language: m.language || '', country_origin: m.country_origin || '',
    is_active: !!+m.is_active, is_featured: !!+m.is_featured, is_free: !!+m.is_free, is_kids: !!+m.is_kids,
    intro_start: secs(m.intro_start), intro_end: secs(m.intro_end), credits_start: secs(m.credits_start),
  };
  const set = (k) => (v) => setF({ ...form, [k]: v && v.target ? v.target.value : v });

  const save = async () => {
    setBusy(true);
    try {
      await api.post('content_save', { id, ...form, is_active: form.is_active ? 1 : 0, is_featured: form.is_featured ? 1 : 0, is_free: form.is_free ? 1 : 0, is_kids: form.is_kids ? 1 : 0,
        intro_start: parseSecs(form.intro_start), intro_end: parseSecs(form.intro_end), credits_start: parseSecs(form.credits_start) });
      toast('Saved'); setF(null); reload(); onSaved();
    } catch (e) { toast(e.message, 'err'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        {m.cover_image && <img src={m.cover_image} alt="" style={{ width: 80, height: 116, objectFit: 'cover', borderRadius: 10 }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: COND, fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.1 }}>{m.title}</div>
          <div style={{ fontSize: '.76rem', color: C.faint, marginTop: 4 }}>#{m.id} · {m.slug}</div>
          <div style={{ fontSize: '.76rem', color: C.dim, marginTop: 6 }}>{data.genres.map(g => g.name).join(', ') || 'No genres'}</div>
          <div style={{ fontSize: '.76rem', color: C.dim, marginTop: 2 }}>{compact(m.view_count)} views</div>
        </div>
      </div>

      <Card style={{ padding: '2px 14px', marginBottom: 14 }}>
        <Toggle label="Live in the app" sub="Hidden titles disappear from every row and search" on={form.is_active} onChange={set('is_active')} />
        <Toggle label="Featured" sub="Can appear in the home hero" on={form.is_featured} onChange={set('is_featured')} />
        <Toggle label="Free to watch" on={form.is_free} onChange={set('is_free')} />
        <Toggle label="Kids title" sub="Shown in Kids mode" on={form.is_kids} onChange={set('is_kids')} />
      </Card>

      <Input label="Title" value={form.title} onChange={set('title')} />
      <TextArea label="Description" value={form.description} onChange={set('description')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input label="Year" inputMode="numeric" value={form.release_year} onChange={set('release_year')} />
        <Input label="Age rating" value={form.age_rating} onChange={set('age_rating')} placeholder="PG-13" />
        <Input label="Language" value={form.language} onChange={set('language')} />
        <Input label="Country" value={form.country_origin} onChange={set('country_origin')} />
      </div>

      <H style={{ marginTop: 8 }}>Player markers</H>
      <div style={{ fontSize: '.74rem', color: C.faint, margin: '-4px 2px 10px' }}>Minutes:seconds. Powers "Skip Intro" and the next-episode countdown.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Input label="Intro start" placeholder="0:00" value={form.intro_start} onChange={set('intro_start')} />
        <Input label="Intro end" placeholder="1:30" value={form.intro_end} onChange={set('intro_end')} />
        <Input label="Credits" placeholder="42:10" value={form.credits_start} onChange={set('credits_start')} />
      </div>

      <Btn busy={busy} onClick={save} style={{ width: '100%', marginTop: 4 }}>Save changes</Btn>

      <Subtitles type="movie" targetId={id} list={data.subtitles} onChange={reload} />

      {data.episodes.length > 0 && (
        <>
          <H>Episodes ({data.episodes.length})</H>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.episodes.map(e => (
              <Card key={e.id} onClick={() => setEp(e)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, cursor: 'pointer', opacity: +e.is_active ? 1 : .55 }}>
                <span style={{ fontFamily: COND, fontWeight: 900, color: C.red, width: 52 }}>S{e.season_number}E{e.episode_number}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '.86rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                {e.intro_end != null && <Badge color={C.blue}>Intro</Badge>}
                {!+e.is_active && <Badge>Hidden</Badge>}
              </Card>
            ))}
          </div>
        </>
      )}
      <Sheet open={!!ep} onClose={() => setEp(null)} title={ep ? `S${ep.season_number} E${ep.episode_number}` : ''}>
        {ep && <EpisodeEditor ep={ep} onSaved={() => { setEp(null); reload(); }} />}
      </Sheet>
    </div>
  );
}

function EpisodeEditor({ ep, onSaved }) {
  const [f, setF] = useState({ title: ep.title || '', is_active: !!+ep.is_active, is_free: !!+ep.is_free, intro_start: secs(ep.intro_start), intro_end: secs(ep.intro_end), credits_start: secs(ep.credits_start) });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF(x => ({ ...x, [k]: v && v.target ? v.target.value : v }));
  const save = async () => {
    setBusy(true);
    try {
      await api.post('episode_save', { id: ep.id, title: f.title, is_active: f.is_active ? 1 : 0, is_free: f.is_free ? 1 : 0, intro_start: parseSecs(f.intro_start), intro_end: parseSecs(f.intro_end), credits_start: parseSecs(f.credits_start) });
      toast('Episode saved'); onSaved();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  return (
    <div>
      <Input label="Title" value={f.title} onChange={set('title')} />
      <Card style={{ padding: '2px 14px', marginBottom: 14 }}>
        <Toggle label="Live" on={f.is_active} onChange={set('is_active')} />
        <Toggle label="Free episode" on={f.is_free} onChange={set('is_free')} />
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Input label="Intro start" placeholder="0:00" value={f.intro_start} onChange={set('intro_start')} />
        <Input label="Intro end" placeholder="1:30" value={f.intro_end} onChange={set('intro_end')} />
        <Input label="Credits" placeholder="42:10" value={f.credits_start} onChange={set('credits_start')} />
      </div>
      <Btn busy={busy} onClick={save} style={{ width: '100%' }}>Save episode</Btn>
    </div>
  );
}

function Subtitles({ type, targetId, list, onChange }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ language_name: 'English', language_code: 'en', url: '' });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { await api.post('subtitle_add', { type, target_id: targetId, ...f }); toast('Subtitle added'); setAdding(false); setF({ language_name: 'English', language_code: 'en', url: '' }); onChange(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const del = async (s) => {
    if (!(await confirmDialog({ title: 'Remove subtitle?', message: `${s.language_name} will no longer show in the player.`, confirm: 'Remove', danger: true }))) return;
    try { await api.post('subtitle_delete', { type, id: s.id }); toast('Removed'); onChange(); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <>
      <H right={!adding && <Btn kind="ghost" small onClick={() => setAdding(true)}>+ Add</Btn>}>Subtitles</H>
      {list.length === 0 && !adding && <div style={{ color: C.faint, fontSize: '.84rem', margin: '0 2px' }}>No subtitles yet.</div>}
      {list.map(s => (
        <Card key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 6 }}>
          <Badge color={C.blue}>{s.format}</Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '.86rem' }}>{s.language_name}</div>
            <div style={{ fontSize: '.7rem', color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subtitle_url}</div>
          </div>
          <Btn kind="danger" small onClick={() => del(s)}>Remove</Btn>
        </Card>
      ))}
      {adding && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <Input label="Language" value={f.language_name} onChange={e => setF({ ...f, language_name: e.target.value })} />
            <Input label="Code" value={f.language_code} onChange={e => setF({ ...f, language_code: e.target.value })} />
          </div>
          <Input label="File URL (.vtt or .srt)" placeholder="https://…" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" style={{ flex: 1 }} onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn busy={busy} style={{ flex: 1 }} onClick={add} disabled={!f.url}>Add subtitle</Btn>
          </div>
        </Card>
      )}
    </>
  );
}
