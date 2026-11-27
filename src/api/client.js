import axios from 'axios';

const TOKEN_KEY = 'showmine_token';

const client = axios.create({
  baseURL: 'https://v2.showmine.ng/api/v2',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  // A caller may pass its own token (or '' for none); don't overwrite it
  if (token && config.headers['X-Auth-Token'] === undefined) {
    config.headers['X-Auth-Token'] = token;
  }
  // Active viewer profile ("Who's watching?"); 0/absent = the account's main profile.
  const pid = localStorage.getItem('showmine_profile');
  if (pid && pid !== '0' && config.params?._pid === undefined) {
    config.params = { ...(config.params || {}), _pid: pid };
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;