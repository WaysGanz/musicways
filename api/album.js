const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const id = String(L.query(req).id || '');
  if (!/^[A-Za-z0-9_-]{2,40}$/.test(id)) return L.fail(res, 'ID tidak valid', 400);
  try {
    const [pRaw, tracks] = await Promise.all([
      L.audius('/v1/playlists/' + id),
      L.audius('/v1/playlists/' + id + '/tracks'),
    ]);
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    if (!p) return L.fail(res, 'Playlist tidak ditemukan', 404);
    const list = (tracks || []).filter(t => t && t.id && t.is_streamable !== false);
    L.send(res, {
      status: true,
      result: {
        id: p.id,
        title: p.playlist_name || 'Playlist',
        artist: (p.user && p.user.name) || '',
        description: p.description || '',
        thumbnails: L.thumbs(L.cover(p)),
        songs: list.map(L.mapSongThumbs),
      },
    }, 'public, s-maxage=300, stale-while-revalidate=900');
  } catch (e) {
    L.fail(res, 'Gagal memuat playlist', 502);
  }
};
