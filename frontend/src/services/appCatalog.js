// Canonical catalogue of streaming services we care about.
//
// Each service has a stable `key` that the BACKEND also uses (see
// backend/src/providers.js) to tag JustWatch offers, plus the candidate webOS
// application IDs to probe with getAppLoadStatus. A service counts as
// "installed" if ANY of its candidate IDs reports exist:true — this covers
// services that ship under more than one appId across firmware versions.
//
// All IDs below were confirmed on a real webOS 24 TV (2026-07). The UK
// broadcasters were the surprises: Channel 4 and ITV now ship as Freeview Play
// apps (com.fvp.*), and BBC iPlayer carries a version suffix.
//
// CAVEAT — version-suffixed IDs (e.g. bbc.iplayer.3.0) can change when the app
// updates. We keep the unsuffixed / legacy id as a fallback candidate so
// detection still has a chance across firmware; a service counts as installed
// if ANY of its candidate IDs reports exist:true.
//
// A webOS app CANNOT enumerate installed apps (listApps is denied to third
// parties), which is why we probe each candidate id with getAppLoadStatus. If a
// broadcaster stops being detected after an update, re-check its id on-device
// (open the app, then `ares-launch -d tv --running`) and update the list here.
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
	{
		key: 'iplayer',
		name: 'BBC iPlayer',
		appIds: ['bbc.iplayer.3.0', 'bbc.iplayer'],
		verified: true,
	},
	{key: 'now', name: 'NOW', appIds: ['now.tv', 'nowtv'], verified: true},
	{
		key: 'channel4',
		name: 'Channel 4',
		appIds: ['com.fvp.ch4', 'channel4', 'all4.app'],
		verified: true,
	},
	{key: 'itvx', name: 'ITVX', appIds: ['com.fvp.itv', 'itvx'], verified: true},
];

// Flat list of every candidate appId, for the mount-time probe.
export const ALL_APP_IDS = [...new Set(CATALOG.flatMap((s) => s.appIds))];

// key → catalogue entry
export const CATALOG_BY_KEY = Object.fromEntries(
	CATALOG.map((s) => [s.key, s]),
);
