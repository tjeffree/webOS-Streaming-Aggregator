// Thin client for the local Node.js backend proxy (see backend/src/server.js).
//
// The backend host is baked in at build time. Enact's CLI (webpack) only
// inlines env vars prefixed REACT_APP_, so the override var must be
// REACT_APP_BACKEND_URL. The default points at the Docker container's LAN
// address (host port 3050 → container 3000; see docker-compose.yml).
const BASE_URL = (
	process.env.REACT_APP_BACKEND_URL || 'http://192.168.0.72:3050'
).replace(/\/$/, '');

const request = async (path) => {
	const res = await fetch(`${BASE_URL}${path}`);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || `Request failed (${res.status})`);
	}
	return res.json();
};

/**
 * Search JustWatch (via the proxy) for a title's streaming availability.
 * @param {string} title
 * @returns {Promise<{query: string, results: Array}>}
 */
export const searchTitle = (title) =>
	request(`/api/search?title=${encodeURIComponent(title)}`);

/**
 * Fetch the provider → webOS-appId mapping the backend knows about.
 * @returns {Promise<{providers: Array}>}
 */
export const getProviders = () => request('/api/providers');

export {BASE_URL};
