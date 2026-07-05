// Maps JustWatch packages onto the canonical service keys the frontend knows
// about (frontend/src/services/appCatalog.js MUST use the same keys).
//
// We key primarily on JustWatch's stable numeric packageId, with a
// technicalName fallback for resilience if an ID ever shifts. Provider strings
// were live-verified against apis.justwatch.com for country=GB (2026-07-05).
//
// Note the deliberate folding: a single logical service on the TV often maps to
// several JustWatch packages — e.g. Amazon's subscription (9), rent/buy store
// (10) and ad tier (613) all launch the one `amazon` webOS app, and Apple TV+
// (350) + iTunes store (2) both open Apple TV. We collapse them here.

// packageId → service key
const PACKAGE_ID_TO_KEY = {
	8: 'netflix',
	9: 'prime', // Amazon Prime Video (subscription)
	10: 'prime', // Amazon Video (rent/buy)
	613: 'prime', // Amazon Prime Video Free with Ads
	337: 'disney', // Disney Plus
	350: 'appletv', // Apple TV+
	2: 'appletv', // Apple TV / iTunes store
	38: 'iplayer', // BBC iPlayer
	39: 'now', // Now TV
	591: 'now', // Now TV Cinema
	103: 'channel4', // Channel 4 (technicalName still "all4")
	41: 'itvx', // ITVX (technicalName "itv")
};

// technicalName → service key (fallback path)
const TECHNICAL_NAME_TO_KEY = {
	netflix: 'netflix',
	amazonprime: 'prime',
	amazon: 'prime',
	amazonimdbtv: 'prime',
	disneyplus: 'disney',
	appletvplus: 'appletv',
	itunes: 'appletv',
	bbc: 'iplayer',
	nowtv: 'now',
	nowtvcinema: 'now',
	all4: 'channel4',
	itv: 'itvx',
};

// key → display name
const SERVICE_NAMES = {
	netflix: 'Netflix',
	prime: 'Amazon Prime Video',
	disney: 'Disney+',
	appletv: 'Apple TV',
	iplayer: 'BBC iPlayer',
	now: 'NOW',
	channel4: 'Channel 4',
	itvx: 'ITVX',
};

function keyForPackage(pkg) {
	if (!pkg) return null;
	if (pkg.packageId != null && PACKAGE_ID_TO_KEY[pkg.packageId]) {
		return PACKAGE_ID_TO_KEY[pkg.packageId];
	}
	if (pkg.technicalName && TECHNICAL_NAME_TO_KEY[pkg.technicalName]) {
		return TECHNICAL_NAME_TO_KEY[pkg.technicalName];
	}
	return null;
}

/**
 * Collapse a title's raw JustWatch offers into the tracked services the TV can
 * launch, deduping monetization types. Offers on providers we don't map (random
 * Amazon Channel resellers, etc.) are dropped so the UI stays focused on "apps
 * you could actually have".
 *
 * @param {Array} offers raw JustWatch offer objects
 * @returns {Array<{key, name, technicalName, monetization: string[]}>}
 */
export function decorateOffers(offers = []) {
	const byKey = new Map();

	for (const offer of offers) {
		const key = keyForPackage(offer?.package);
		if (!key) continue;

		if (!byKey.has(key)) {
			byKey.set(key, {
				key,
				name: SERVICE_NAMES[key],
				technicalName: offer.package.technicalName,
				monetization: new Set(),
			});
		}
		if (offer.monetizationType) {
			byKey.get(key).monetization.add(offer.monetizationType);
		}
	}

	return [...byKey.values()].map((p) => ({
		...p,
		monetization: [...p.monetization],
	}));
}

// Summary of every service we understand, for GET /api/providers.
decorateOffers.mappingSummary = () =>
	Object.entries(SERVICE_NAMES).map(([key, name]) => ({key, name}));
