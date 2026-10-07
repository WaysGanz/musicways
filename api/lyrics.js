// Lirik dari LRCLIB (gratis, tanpa API key)
const L = require('./_lib');

function clean(s) {
  return String(s || '')
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/\b(feat|ft)\.?\s.*$/i, ' ')
    .replace(/\s+-\s+.*$/, ' ')
    .replace(/\s+/g, ' ').trim();
}

function parseLrc(lrc) {
  const lines = [];
  String(lrc).split('\n').forEach(row => {
    const stamps = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const text = row.replace(/\[[^\]]*\]/g, '').trim();
    stamps.forEach(m => {
      if (text) lines.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text });
    });
  });
  return lines.sort((a, b) => a.time - b.time);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const qv = L.query(req);
  let title = String(qv.title || '');
  let artist = String(qv.artist || '');
  const id = String(qv.id || '');
  try {
    if ((!title || !artist) && /^[A-Za-z0-9_-]{3,40}$/.test(id)) {
      const t = await L.audius('/v1/tracks/' + id).catch(() => null);
      const tr = Array.isArray(t) ? t[0] : t;
      if (tr) { title = title || tr.title; artist = artist || (tr.user && tr.user.name) || ''; }
    }
    title = clean(title); artist = clean(artist);
    if (!title) return L.send(res, { status: false, message: 'Judul kosong' }, 'public, s-maxage=300');

    const url = 'https://lrclib.net/api/search?' + new URLSearchParams({ track_name: title, artist_name: artist });
    const r = await fetch(url, {
      headers: { 'User-Agent': 'WayssMusify (https://vercel.app)' },
      signal: AbortSignal.timeout(8000),
    });
    let arr = r.ok ? await r.json() : [];
    if ((!arr || !arr.length) && artist) {
      const r2 = await fetch('https://lrclib.net/api/search?' + new URLSearchParams({ q: title + ' ' + artist }), {
        headers: { 'User-Agent': 'WayssMusify (https://vercel.app)' }, signal: AbortSignal.timeout(8000),
      });
      arr = r2.ok ? await r2.json() : [];
    }
    const synced = (arr || []).find(x => x.syncedLyrics);
    if (synced) {
      const lines = parseLrc(synced.syncedLyrics);
      if (lines.length) return L.send(res, { status: true, result: { lyrics: { type: 'synced', lines } } }, 'public, s-maxage=86400');
    }
    const plain = (arr || []).find(x => x.plainLyrics);
    if (plain) {
      const lines = plain.plainLyrics.split('\n').map(t => ({ text: t.trim() })).filter(x => x.text);
      if (lines.length) return L.send(res, { status: true, result: { lyrics: { type: 'plain', lines } } }, 'public, s-maxage=86400');
    }
    L.send(res, { status: false, message: 'Lirik tidak ditemukan' }, 'public, s-maxage=3600');
  } catch (e) {
    L.send(res, { status: false, message: 'Gagal memuat lirik' }, 'no-store');
  }
};
