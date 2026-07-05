// Canonical catalogue of streaming services we care about.
//
// Each service has a stable `key` that the BACKEND also uses (see
// backend/src/providers.js) to tag JustWatch offers, plus the candidate webOS
// application IDs to probe with getAppLoadStatus. A service counts as
// "installed" if ANY of its candidate IDs reports exist:true — this covers
// services that ship under more than one appId across firmware versions.
//
// Confidence notes (verified 2026-07):
//   * netflix / amazon / disney       — well established across LG firmware.
//   * appletv                         — ships as either bundle id; probe both.
//   * UK broadcasters (iplayer/now/
//     channel4/itvx)                  — UNVERIFIED. appIds vary by webOS
//     version, model year and region (LG re-platformed the Freeview Play apps
//     away from the old dukitv host in recent firmware). The strings below are
//     best-effort guesses.
//
// A webOS app CANNOT enumerate installed apps (listApps is denied to third
// parties), which is why we probe each candidate id with getAppLoadStatus. To
// discover the REAL ids for your TV, dump them from the dev machine over the
// Developer Mode connection (this bypasses the in-app restriction):
//   ares-install --device <tv> --list -F
// then paste the correct strings below. Target here: webOS 24 (Chromium 108).
export const CATALOG = [
	{key: 'netflix', name: 'Netflix', appIds: ['netflix'], verified: true},
	{key: 'prime', name: 'Amazon Prime Video', appIds: ['amazon'], verified: true},
	{
		key: 'disney',
		name: 'Disney+',
		appIds: ['com.disney.disneyplus-prod'],
		verified: true,
	},
	{
		key: 'appletv',
		name: 'Apple TV',
		appIds: ['com.apple.appletv', 'com.apple.appletv.web'],
		verified: true,
	},
	{key: 'iplayer', name: 'BBC iPlayer', appIds: ['bbc.iplayer'], verified: false},
	{key: 'now', name: 'NOW', appIds: ['nowtv'], verified: false},
	{key: 'channel4', name: 'Channel 4', appIds: ['channel4', 'all4.app'], verified: false},
	{key: 'itvx', name: 'ITVX', appIds: ['itvx'], verified: false},
];

// Flat list of every candidate appId, for the mount-time probe.
export const ALL_APP_IDS = [...new Set(CATALOG.flatMap((s) => s.appIds))];

// key → catalogue entry
export const CATALOG_BY_KEY = Object.fromEntries(
	CATALOG.map((s) => [s.key, s]),
);
