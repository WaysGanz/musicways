const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const q = String(L.query(req).q || '').trim();
  if (!q) return L.send(res, [], 'public, s-maxage=60');
  try {
    const d = await L.audius('/v1/tracks/search', { query: q, limit: 8 });
    const out = [];
    (d || []).forEach(t => {
      if (t.title && !out.includes(t.title)) out.push(t.title);
      const n = t.user && t.user.name;
      if (n && !out.includes(n) && n.toLowerCase().includes(q.toLowerCase())) out.push(n);
    });
    L.send(res, out.slice(0, 8), 'public, s-maxage=300');
  } catch (e) {
    L.send(res, [], 'no-store');
  }
};
