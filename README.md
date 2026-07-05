# webOS Streaming Aggregator

Find out which of the streaming apps **you already have installed** on your LG TV
can play a given film or show. Type a title, and the app cross-references
JustWatch's UK catalogue against the apps actually installed on the TV,
highlighting the ones you can watch on right now.

See [`handoff.md`](./handoff.md) for the original architecture brief.

## Architecture

| Component | Tech | Role |
|-----------|------|------|
| **Frontend** (`frontend/`) | Enact + Sandstone, Spotlight (D-Pad) | webOS UI. Searches the backend, probes installed apps via the Luna bus (`getAppLoadStatus`), launches installed apps. |
| **Backend** (`backend/`) | Node.js + Express, node-cache | Local proxy. Queries JustWatch's GraphQL API, folds providers onto known services, caches 24h, serves CORS-open JSON. |

The two share a set of canonical **service keys** (`netflix`, `prime`, `disney`,
`appletv`, `iplayer`, `now`, `channel4`, `itvx`). The backend tags each JustWatch
offer with a key (`backend/src/providers.js`); the frontend maps that key to the
candidate webOS appIds to probe/launch (`frontend/src/services/appCatalog.js`).

## Backend

```bash
cd backend
npm install
npm start          # listens on :3000  (npm run dev for watch mode)
npm test           # unit tests for the provider mapping
```

Endpoints:

- `GET /health` — status + cache stats
- `GET /api/providers` — the service keys the backend understands
- `GET /api/search?title=...` — streaming availability, grouped by service

```jsonc
// GET /api/search?title=Men in Black
{
  "query": "Men in Black",
  "country": "GB",
  "results": [
    {
      "title": "Men in Black", "year": 1997, "type": "MOVIE",
      "providers": [
        {"key": "now", "name": "NOW", "monetization": ["FLATRATE"]},
        {"key": "appletv", "name": "Apple TV", "monetization": ["RENT"]}
      ]
    }
  ]
}
```

Config via env vars: `PORT`, `JW_COUNTRY` (default `GB`), `JW_LANGUAGE` (`en`),
`CACHE_TTL_SECONDS` (`86400`).

> JustWatch's API is unofficial/undocumented. Provider `packageId`s were
> live-verified for the GB market on 2026-07-05; they're the stable mapping key.

## Frontend (webOS)

```bash
cd frontend
npm install
npm run serve       # dev server in a browser
npm run pack-p      # production build for the TV → ./dist
```

The backend URL defaults to `http://192.168.0.72:3050`. To target a different
host, set `REACT_APP_BACKEND_URL` at build time (Enact/webpack only inlines
`REACT_APP_`-prefixed vars):

```powershell
# PowerShell (Windows)
$env:REACT_APP_BACKEND_URL = "http://192.168.0.72:3050"; npm run pack-p
```

Then package and install to a TV in Developer Mode (see the full walkthrough
below):

```bash
ares-package ./dist
ares-install --device <tv> ./com.tjeffree.streamingaggregator_1.0.0_all.ipk
```

Target firmware: **webOS 24** (Chromium 108) — the bundle's JS/CSS is well
within that engine.

> **UK broadcaster appIds are unverified** and vary by webOS version/model. A
> webOS app can't list installed apps (blocked for third parties), so the app
> probes each candidate id with `getAppLoadStatus`. Dump the real ids from your
> TV over the Developer Mode connection — `ares-install --device <tv> --list -F`
> — and update the guesses in `appCatalog.js`. Netflix, Prime, Disney+ and Apple
> TV are confirmed.

## CI/CD & deployment

`.github/workflows/docker-image.yml` builds `backend/` and publishes it to GHCR
on every push to `main` (and on `v*` tags):

```
ghcr.io/tjeffree/webos-streaming-aggregator:latest
```

### Deploy with Portainer

1. In Portainer: **Stacks → Add stack**.
2. Use the repository option pointed at this repo (compose path
   `docker-compose.yml`), or paste `docker-compose.yml` into the web editor.
3. Deploy. Portainer pulls the GHCR image and runs it, published on host port
   `3050` (→ container `3000`). Check `http://192.168.0.72:3050/health`.

If the GHCR package is private, add registry credentials in Portainer
(**Registries → GitHub**, using a PAT with `read:packages`), or make the package
public in the repo's package settings.
