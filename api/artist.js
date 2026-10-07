const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  let id = String(L.query(req).id || '');
  const name = String(L.query(req).name || '');
  try {
    // ID lama bergaya YouTube (UC...) -> cari artis berdasarkan nama
    if (!id || /^UC[\w-]{20,}$/.test(id)) {
      if (!name) return L.fail(res, 'Artis tidak ditemukan', 404);
      const found = await L.audius('/v1/users/search', { query: name, limit: 1 });
      if (!found || !found[0]) return L.fail(res, 'Artis tidak ditemukan di Audius', 404);
      id = found[0].id;
    }
    const [uRaw, tracks] = await Promise.all([
      L.audius('/v1/users/' + encodeURIComponent(id)),
      L.audius('/v1/users/' + encodeURIComponent(id) + '/tracks', { limit: 30, sort: 'plays' }).catch(() => []),
    ]);
    const u = Array.isArray(uRaw) ? uRaw[0] : uRaw;
    if (!u) return L.fail(res, 'Artis tidak ditemukan', 404);
    const list = (tracks || []).filter(t => t && t.id && t.is_streamable !== false);
    L.send(res, {
      status: true,
      result: {
        id: u.id,
        name: u.name,
        thumbnails: L.thumbs(L.avatar(u)),
        topSongs: list.map(L.mapSongThumbs),
        topAlbums: [], topSingles: [], topVideos: [], playlists: [], featuredOn: [], similarArtists: [],
      },
    }, 'public, s-maxage=300, stale-while-revalidate=900');
  } catch (e) {
    L.fail(res, 'Gagal memuat artis', 502);
  }
};
