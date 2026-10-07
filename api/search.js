const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { L.cors(res); return res.end(); }
  const q = String(L.query(req).query || '').trim();
  const type = String(L.query(req).type || 'all');
  const want = (t) => type === 'all' || type === t;
  const trending = !q || /^trend/i.test(q);

  const songs = want('songs') ? (async () => {
    const d = trending
      ? await L.audius('/v1/tracks/trending', { limit: 24, time: 'week' })
      : await L.audius('/v1/tracks/search', { query: q, limit: 24 });
    return (d || []).filter(t => t && t.id && !t.is_delete && t.is_streamable !== false).map(L.mapSong);
  })() : Promise.resolve([]);

  const playlists = want('playlists') ? (async () => {
    let d = [];
    if (!trending) d = await L.audius('/v1/playlists/search', { query: q, limit: 18 }).catch(() => []);
    if (!d || d.length === 0) d = await L.audius('/v1/playlists/trending', { limit: 18, time: 'week' }).catch(() => []);
    return (d || []).filter(p => p && p.id).map(L.mapPlaylist);
  })() : Promise.resolve([]);

  const artists = want('artists') ? (async () => {
    if (trending) return [];
    const d = await L.audius('/v1/users/search', { query: q, limit: 12 });
    return (d || []).filter(u => u && u.id).map(L.mapArtist);
  })() : Promise.resolve([]);

  const [s, p, a] = await Promise.allSettled([songs, playlists, artists]);
  if (s.status === 'rejected' && p.status === 'rejected' && a.status === 'rejected') {
    return L.fail(res, 'Sumber musik tidak bisa dihubungi', 502);
  }
  const val = (r) => (r.status === 'fulfilled' ? r.value : []);
  L.send(res, {
    status: true,
    result: { songs: val(s), playlists: val(p), albums: [], artists: val(a) },
  }, 'public, s-maxage=120, stale-while-revalidate=600');
};
