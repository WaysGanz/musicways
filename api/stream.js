// Redirect ke stream audio Audius (di-resolve setiap diputar supaya tidak kedaluwarsa)
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const id = String(L.query(req).id || '');
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(id)) return L.fail(res, 'ID tidak valid', 400);

  const qs = new URLSearchParams({ app_name: L.APP });
  if (process.env.AUDIUS_API_KEY) qs.set('api_key', process.env.AUDIUS_API_KEY);
  const path = '/v1/tracks/' + id + '/stream?' + qs.toString();

  for (const h of [L.PRIMARY, ...L.FALLBACK]) {
    try {
      const r = await fetch(h + path, { redirect: 'manual', signal: AbortSignal.timeout(7000) });
      const loc = r.headers.get('location');
      if (r.status >= 300 && r.status < 400 && loc) {
        L.cors(res);
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 302;
        res.setHeader('Location', loc);
        return res.end();
      }
    } catch (e) {}
  }
  // fallback: biarkan browser yang mengikuti redirect Audius
  L.cors(res);
  res.statusCode = 302;
  res.setHeader('Location', L.PRIMARY + path);
  res.end();
};
