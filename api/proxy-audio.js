// Dipakai frontend saat equalizer aktif. Hanya meneruskan ke /api/stream milik sendiri.
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const raw = String(L.query(req).url || '');
  let target;
  try {
    const base = 'https://' + (req.headers.host || 'localhost');
    const u = new URL(raw, base);
    if (u.host !== (req.headers.host || '') || !u.pathname.startsWith('/api/stream')) throw new Error('x');
    target = u.pathname + u.search;
  } catch (e) {
    return L.fail(res, 'URL tidak diizinkan', 400);
  }
  L.cors(res);
  res.statusCode = 302;
  res.setHeader('Location', target);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
};
