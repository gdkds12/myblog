import GhostContentAPI from '@tryghost/content-api';

if (!process.env.NEXT_PUBLIC_GHOST_URL || !process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
  throw new Error('Ghost API URL and Content API Key must be set in environment variables');
}

const api = new GhostContentAPI({
  url: process.env.NEXT_PUBLIC_GHOST_URL,
  key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY,
  version: "v5.0"
});

export default api;
