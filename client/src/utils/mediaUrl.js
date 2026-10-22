const API_BASE_URL = '/backend';

export function mediaUrl(filePath) {
  const rawPath = String(filePath ?? '').trim();

  if (!rawPath || rawPath.toLowerCase() === 'null' || rawPath.toLowerCase() === 'undefined') {
    return '/image-placeholder.svg';
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  // Older rows may contain an absolute local path such as C:\...\uploads\file.png.
  // New uploads in production are stored as absolute Cloudinary URLs above.
  const filename = rawPath.replace(/\\/g, '/').split('/').filter(Boolean).pop();
  if (!filename || filename === '.' || filename === '..') {
    return '/image-placeholder.svg';
  }

  return `${API_BASE_URL}/uploads/${encodeURIComponent(filename)}`;
}
