// Centralised runtime configuration, sourced from environment variables with
// sensible local-network defaults (see handoff.md §5 — the box is expected to
// sit next to MQTT / Home Assistant on a trusted LAN).

const int = (value, fallback) => {
	const n = Number.parseInt(value ?? '', 10);
	return Number.isFinite(n) ? n : fallback;
};

export const config = {
	port: int(process.env.PORT, 3000),

	// JustWatch localisation. Defaults to the UK market since the target
	// provider list (BBC iPlayer, NOW, Channel 4, ITVX) is UK-centric.
	country: process.env.JW_COUNTRY || 'GB',
	language: process.env.JW_LANGUAGE || 'en',

	// Cache lifetime. Streaming catalogues move slowly, so 24h keeps us well
	// clear of upstream rate limits (handoff.md §4.2).
	cacheTtlSeconds: int(process.env.CACHE_TTL_SECONDS, 60 * 60 * 24),

	// Upstream JustWatch GraphQL endpoint.
	justwatchEndpoint:
		process.env.JW_ENDPOINT || 'https://apis.justwatch.com/graphql',

	// Network timeout for upstream calls (ms).
	upstreamTimeoutMs: int(process.env.UPSTREAM_TIMEOUT_MS, 10000),
};
