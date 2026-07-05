import NodeCache from 'node-cache';

import { config } from './config.js';

// In-memory cache (handoff.md §4.2). A single process instance is fine for a
// household-scale deployment; if the container is ever restarted the cache
// simply repopulates on demand.
const store = new NodeCache({
	stdTTL: config.cacheTtlSeconds,
	// Clone on get/set is unnecessary here — we only store plain JSON we build
	// ourselves and never mutate afterwards. Disabling it saves memory/CPU.
	useClones: false,
	checkperiod: Math.max(60, Math.floor(config.cacheTtlSeconds / 10)),
});

export const cache = {
	get: (key) => store.get(key),
	set: (key, value) => store.set(key, value),
	stats: () => store.getStats(),
	keys: () => store.keys(),
	flush: () => store.flushAll(),
};
