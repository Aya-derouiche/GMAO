const API_BASE_URL = '/backend';

export function mediaUrl(filePath) {
  const rawPath = String(filePath ?? '').trim();

  if (!rawPath || rawPath.toLowerCase() === 'null' || rawPath.toLowerCase() === 'undefined') {
    return '/image-placeholder.svg';
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  let normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (/^uploads\//i.test(normalizedPath)) {
    normalizedPath = normalizedPath.replace(/^uploads/i, 'uploads');
  } else {
    normalizedPath = `uploads/${normalizedPath}`;
  }

  const encodedPath = normalizedPath.split('/').map(encodeURIComponent).join('/');
  return `${API_BASE_URL}/${encodedPath}`;
}
