import cors from 'cors';
import express from 'express';

import { cache } from './cache.js';
import { config } from './config.js';
import { searchTitle } from './justwatch.js';
import { decorateOffers } from './providers.js';

const app = express();

// handoff.md §4.2 — webOS apps load over file:// so every response needs
// permissive CORS. This is a LAN-only service, so `*` is acceptable.
app.use(cors());
app.disable('x-powered-by');

// --- Health / diagnostics -------------------------------------------------

app.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		country: config.country,
		language: config.language,
		cache: cache.stats(),
	});
});

// Expose the webOS-appId ↔ provider mapping so the frontend knows which
// Luna app-installed checks to run.
app.get('/api/providers', (_req, res) => {
	res.json({ providers: decorateOffers.mappingSummary() });
});

// --- Core search endpoint (handoff.md §4.2) -------------------------------

app.get('/api/search', async (req, res) => {
	const title = (req.query.title || '').toString().trim();
	if (!title) {
		return res
			.status(400)
			.json({ error: 'Missing required query parameter: title' });
	}

	const country = (req.query.country || config.country).toString().toUpperCase();
	const language = (req.query.language || config.language).toString();
	const cacheKey = `search:${country}:${language}:${title.toLowerCase()}`;

	const cached = cache.get(cacheKey);
	if (cached) {
		res.set('X-Cache', 'HIT');
		return res.json(cached);
	}

	try {
		const rawResults = await searchTitle(title, { country, language });

		const payload = {
			query: title,
			country,
			language,
			generatedAt: new Date().toISOString(),
			results: rawResults.map((item) => ({
				title: item.title,
				year: item.year,
				type: item.type,
				// Annotate each JustWatch offer with the matching webOS appId.
				providers: decorateOffers(item.offers),
			})),
		};

		cache.set(cacheKey, payload);
		res.set('X-Cache', 'MISS');
		res.json(payload);
	} catch (err) {
		console.error(`[search] "${title}" failed:`, err.message);
		res.status(502).json({
			error: 'Upstream JustWatch request failed',
			detail: err.message,
		});
	}
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(config.port, () => {
	console.log(
		`webOS Streaming Aggregator backend listening on :${config.port} ` +
			`(market ${config.country}/${config.language}, cache ${config.cacheTtlSeconds}s)`,
	);
});
