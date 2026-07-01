let apiUrl = '/api';

if (typeof window !== 'undefined') {
  const meta = document.querySelector('meta[name="api-url"]');
  if (meta) {
    const content = meta.getAttribute('content');
    if (content) {
      apiUrl = content.replace(/\/$/, '');
    }
  }
}

export const API_URL = apiUrl;
