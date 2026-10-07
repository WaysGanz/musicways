// Nama endpoint dipertahankan agar cocok dengan frontend.
// Mengembalikan URL audio stabil (/api/stream?id=...) yang di-resolve saat diputar.
const L = require('./_lib');

function extractId(q) {
  q = String(q || '').trim();
  const m = q.match(/(?:[?&]v=|audius:|\/track\/)([A-Za-z0-9_-]{3,40})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{3,40}$/.test(q)) return q;
  return '';
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const raw = req.method === 'POST' ? L.body(req).query : L.query(req).query;
  const id = extractId(raw);
  if (!id) return L.fail(res, 'ID lagu tidak valid', 400);
  L.send(res, {
    status: true,
    result: { id, download: { audio: '/api/stream?id=' + encodeURIComponent(id) } },
  }, 'public, s-maxage=3600');
};
