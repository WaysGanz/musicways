// Helper bersama untuk semua endpoint /api (file berawalan "_" tidak dijadikan route oleh Vercel)
const APP = process.env.AUDIUS_APP_NAME || 'WayssMusify';
const KEY = process.env.AUDIUS_API_KEY || '';
const PRIMARY = (process.env.AUDIUS_HOST || 'https://api.audius.co').replace(/\/$/, '');
const FALLBACK = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
];
const PLACEHOLDER = '/logo.png';

let goodHost = null;
let discovered = null;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
}

function send(res, obj, cache, code) {
  cors(res);
  res.statusCode = code || 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (cache) res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(obj));
}

function fail(res, msg, code) {
  send(res, { status: false, message: msg }, 'no-store', code || 500);
}

function query(req) {
  if (req.query) return req.query;
  const u = new URL(req.url, 'http://x');
  return Object.fromEntries(u.searchParams.entries());
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

async function discoverHosts() {
  if (discovered) return discovered;
  try {
    const r = await fetch('https://api.audius.co', { signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    if (Array.isArray(j.data)) discovered = j.data.map(h => h.replace(/\/$/, '')).slice(0, 5);
  } catch (e) {}
  return discovered || [];
}

async function tryHost(host, path, qs) {
  const r = await fetch(host + path + '?' + qs, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (j && j.data === undefined) throw new Error('bad response');
  return j.data;
}

// Panggil API Audius dengan fallback ke host lain
async function audius(path, params) {
  const qs = new URLSearchParams(Object.assign({ app_name: APP }, params || {}));
  if (KEY) qs.set('api_key', KEY);
  const qstr = qs.toString();
  const order = [goodHost, PRIMARY, ...FALLBACK].filter(Boolean);
  const seen = new Set();
  let lastErr;
  for (let pass = 0; pass < 2; pass++) {
    for (const h of order) {
      if (seen.has(h)) continue;
      seen.add(h);
      try {
        const data = await tryHost(h, path, qstr);
        goodHost = h;
        return data;
      } catch (e) { lastErr = e; }
    }
    if (pass === 0) order.push(...(await discoverHosts()));
  }
  throw lastErr || new Error('Audius tidak bisa dihubungi');
}

function pick(obj, keys) {
  if (!obj) return '';
  for (const k of keys) if (obj[k]) return obj[k];
  return '';
}

function cover(o) {
  const a = pick(o && o.artwork, ['1000x1000', '480x480', '150x150']);
  if (a) return a;
  const p = pick(o && o.user && o.user.profile_picture, ['1000x1000', '480x480', '150x150']);
  return p || PLACEHOLDER;
}

function avatar(u) {
  return pick(u && u.profile_picture, ['1000x1000', '480x480', '150x150']) ||
         pick(u && u.cover_photo, ['2000x', '640x']) || PLACEHOLDER;
}

function mapSong(t) {
  return {
    videoId: t.id,
    title: t.title || 'Tanpa judul',
    artist: (t.user && t.user.name) || 'Unknown',
    artistId: (t.user && t.user.id) || '',
    thumbnail: cover(t),
    url: 'audius:' + t.id,
    duration: t.duration || 0,
  };
}

function mapPlaylist(p) {
  return {
    id: p.id,
    title: p.playlist_name || 'Playlist',
    name: p.playlist_name || 'Playlist',
    cover: cover(p),
    artist: (p.user && p.user.name) || '',
    subtitle: (p.user && p.user.name) || (p.is_album ? 'Album' : 'Playlist'),
    type: p.is_album ? 'album' : 'playlist',
  };
}

function mapArtist(u) {
  return { id: u.id, name: u.name, title: u.name, cover: avatar(u), subtitle: '@' + (u.handle || '') };
}

function thumbs(url) { return [{ url: url || PLACEHOLDER }]; }

function mapSongThumbs(t) {
  return {
    videoId: t.id,
    title: t.title || 'Tanpa judul',
    artist: (t.user && t.user.name) || '',
    artistId: (t.user && t.user.id) || '',
    thumbnails: thumbs(cover(t)),
  };
}

// URL host aman (bukan localhost / IP privat / IP literal)
function safeHost(h) {
  h = String(h || '').toLowerCase();
  if (!h || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return false;
  return true;
}

module.exports = {
  APP, PLACEHOLDER, cors, send, fail, query, body, audius,
  mapSong, mapPlaylist, mapArtist, mapSongThumbs, thumbs, cover, avatar, safeHost, PRIMARY, FALLBACK,
};
