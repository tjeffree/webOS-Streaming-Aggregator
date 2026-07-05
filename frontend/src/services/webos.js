import LS2Request from '@enact/webos/LS2Request';

// Thin wrappers over the Luna Service Bus (handoff.md §3.1).
//
// getAppLoadStatus is a one-shot (non-subscription) call available to ordinary
// third-party apps and returns `{exist: bool}` — exactly the installed check we
// need. listApps is deliberately NOT used: it is denied to non-privileged apps
// on retail TVs.

const APP_MANAGER = 'luna://com.webos.applicationManager';

// True when running inside a real webOS webview (LS2Request can reach Luna).
// In the browser (enact serve) there is no Luna bus, so callers should treat
// everything as "not installed" and rely on the dev fallback.
export const hasLuna =
	typeof window !== 'undefined' && Boolean(window.PalmSystem);

/**
 * Resolve whether a specific appId is installed on this TV.
 * Always resolves (never rejects): failures / missing bus → false.
 * @param {string} appId
 * @returns {Promise<boolean>}
 */
export const checkAppInstalled = (appId) =>
	new Promise((resolve) => {
		if (!hasLuna) {
			resolve(false);
			return;
		}
		new LS2Request().send({
			service: APP_MANAGER,
			method: 'getAppLoadStatus',
			parameters: {appId},
			onSuccess: (res) => resolve(Boolean(res && res.exist)),
			onFailure: () => resolve(false),
		});
	});

/**
 * Launch an installed app by id.
 * @param {string} appId
 * @param {object} [params] optional launch params (e.g. a deep-link payload)
 */
export const launchApp = (appId, params = {}) => {
	if (!hasLuna) {
		// eslint-disable-next-line no-console
		console.info(`[dev] would launch ${appId}`, params);
		return;
	}
	new LS2Request().send({
		service: APP_MANAGER,
		method: 'launch',
		parameters: {id: appId, params},
	});
};
