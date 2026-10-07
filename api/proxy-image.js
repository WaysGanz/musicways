// Proxy gambar (agar bisa dibaca canvas tanpa masalah CORS)
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const raw = String(L.query(req).url || '');
  let u;
  try { u = new URL(raw, 'https://' + (req.headers.host || 'localhost')); } catch (e) { return L.fail(res, 'URL salah', 400); }
  if (u.host === req.headers.host) { L.cors(res); res.statusCode = 302; res.setHeader('Location', u.pathname + u.search); return res.end(); }
  if (u.protocol !== 'https:' || !L.safeHost(u.hostname)) return L.fail(res, 'URL tidak diizinkan', 400);
  try {
    const r = await fetch(u.toString(), { signal: AbortSignal.timeout(8000), redirect: 'follow' });
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !ct.startsWith('image/')) return L.fail(res, 'Bukan gambar', 415);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6 * 1024 * 1024) return L.fail(res, 'Gambar terlalu besar', 413);
    L.cors(res);
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.end(buf);
  } catch (e) {
    L.fail(res, 'Gagal mengambil gambar', 502);
  }
};
