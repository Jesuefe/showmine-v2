import client from './client';

// Thin wrappers for the v2 endpoints added in Nov 2026
// (account.php, progress.php, shorts.php, social.php).
const get = (url) => client.get(url).then((r) => r.data);
const post = (url, body) => client.post(url, body).then((r) => r.data);

export const account = {
  forgotRequest: (email) => post('/account.php?action=forgot_request', { email }),
  forgotReset: (email, code, password) => post('/account.php?action=forgot_reset', { email, code, password }),
  update: (fields) => post('/account.php?action=update', fields),
  changePassword: (current, password) => post('/account.php?action=change_password', { current, password }),
  remove: (password) => post('/account.php?action=delete', { password, confirm: 'DELETE' }),
};

export const progress = {
  save: (movieId, episodeId, position, total) =>
    post('/progress.php?action=save', { movie_id: movieId, episode_id: episodeId || 0, progress: position, total }),
  get: (movieId, episodeId) =>
    get(`/progress.php?action=get&movie_id=${movieId}${episodeId ? `&episode_id=${episodeId}` : ''}`),
  continueList: () => get('/progress.php?action=continue'),
};

export const shorts = {
  feed: (page = 1) => get(`/shorts.php?action=feed&page=${page}`),
  view: (id) => post('/shorts.php?action=view', { id }),
};

export const social = {
  likes: (type, id) => get(`/social.php?action=likes&type=${type}&id=${id}`),
  toggleLike: (type, id) => post('/social.php?action=like', { type, id }),
  comments: (type, id, page = 1) => get(`/social.php?action=comments&type=${type}&id=${id}&page=${page}`),
  addComment: (type, id, body, parentId) => post('/social.php?action=comment', { type, id, body, parent_id: parentId || 0 }),
  deleteComment: (commentId) => post('/social.php?action=delete_comment', { comment_id: commentId }),
  likeComment: (commentId) => post('/social.php?action=like_comment', { comment_id: commentId }),
};

// Category pages map to genre slugs in the genres table.
export const CATEGORIES = [
  { slug: 'nollywood', label: 'Nollywood' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'documentaries', label: 'Documentaries' },
  { slug: 'religious', label: 'Religious' },
  { slug: 'christian', label: 'Christian' },
  { slug: 'muslim', label: 'Muslim' },
  { slug: 'yoruba', label: 'Yoruba' },
  { slug: 'igbo', label: 'Igbo' },
  { slug: 'hausa', label: 'Hausa' },
  { slug: 'hollywood', label: 'Hollywood' },
  { slug: 'bollywood', label: 'Bollywood' },
  { slug: 'kdrama', label: 'K-Drama' },
  { slug: 'action', label: 'Action' },
  { slug: 'drama', label: 'Drama' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'romance', label: 'Romance' },
  { slug: 'thriller', label: 'Thriller' },
  { slug: 'horror', label: 'Horror' },
  { slug: 'animation', label: 'Animation' },
  { slug: 'podcast', label: 'Podcasts' },
];
