import { useState, useEffect } from 'react';
import client from '../api/client';
import { useI18n } from './I18nContext';

/**
 * Translates a list of movie titles for the current language.
 * Returns a map { [movieId]: translatedTitle }. English/untranslated falls back to original.
 */
export function useTranslatedTitles(movies) {
  const { lang } = useI18n();
  const [translated, setTranslated] = useState({});

  useEffect(() => {
    if (lang === 'en' || !movies || movies.length === 0) {
      setTranslated({});
      return;
    }
    const ids = movies.map(m => m.id).filter(Boolean);
    if (ids.length === 0) return;

    client.post('/translate.php?action=batch', { ids, lang })
      .then(res => {
        if (res.data.ok) setTranslated(res.data.titles);
      })
      .catch(() => {});
  }, [lang, movies?.map(m => m.id).join(',')]);

  const getTitle = (movie) => {
    if (lang === 'en') return movie.title;
    return translated[movie.id] || movie.title;
  };

  return { getTitle, loading: lang !== 'en' && Object.keys(translated).length === 0 };
}

/**
 * Translates a single movie's full detail fields (title, short_desc, description).
 */
export function useTranslatedMovie(movieId) {
  const { lang } = useI18n();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (lang === 'en' || !movieId) {
      setData(null);
      return;
    }
    client.get(`/translate.php?action=movie&id=${movieId}&lang=${lang}`)
      .then(res => { if (res.data.ok) setData(res.data); })
      .catch(() => {});
  }, [lang, movieId]);

  return data; // null if English or not yet loaded — caller should fall back to original
}
