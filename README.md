# WayssMusify

Web music player (PWA) + backend serverless (Vercel Functions) di folder `api/`.

## Sumber data
- Lagu, artis, playlist: [Audius](https://audius.co) (lagu penuh, musisi independen)
- Lirik: [LRCLIB](https://lrclib.net)

## Deploy (Vercel)
1. Push repo ke GitHub.
2. Vercel → Add New → Project → pilih repo → Framework: **Other** → Deploy.

## Deploy (Netlify)
1. Push repo ke GitHub.
2. Netlify → Add new site → Import an existing project → pilih repo.
3. Build command: kosongkan. Publish directory: `.` (sudah diatur di `netlify.toml`) → Deploy.

Function Netlify ada di `netlify/functions` dan memakai kode yang sama dari `api/`.

## Environment Variables (opsional)
| Nama | Fungsi |
|---|---|
| `AUDIUS_APP_NAME` | Nama aplikasi untuk Audius (default `WayssMusify`) |
| `AUDIUS_API_KEY` | API key Audius (jika punya) |
| `AUDIUS_HOST` | Paksa host API tertentu |

## Endpoint
`/api/search` `/api/suggest` `/api/artist` `/api/album` `/api/lyrics` `/api/ytplay` `/api/stream` `/api/proxy-audio` `/api/proxy-image`
