import {useCallback, useEffect, useState} from 'react';

import {ALL_APP_IDS, CATALOG_BY_KEY} from '../services/appCatalog.js';
import {checkAppInstalled, hasLuna} from '../services/webos.js';

// Probes the TV once (on mount) for every candidate appId in the catalogue,
// then exposes a fast lookup by service key. A service is "installed" if any of
// its candidate appIds exists; we remember which one so the provider chip can
// launch it.
export default function useInstalledApps() {
	// appId -> boolean
	const [installedIds, setInstalledIds] = useState({});
	const [loading, setLoading] = useState(hasLuna);

	useEffect(() => {
		// Browser / dev: no Luna bus, nothing is "installed". `loading` already
		// initialised to false (hasLuna) so there's nothing to update here.
		if (!hasLuna) return undefined;

		let cancelled = false;
		Promise.all(
			ALL_APP_IDS.map((appId) =>
				checkAppInstalled(appId).then((exist) => [appId, exist]),
			),
		).then((entries) => {
			if (cancelled) return;
			setInstalledIds(Object.fromEntries(entries));
			setLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	// key -> {installed, appId}
	const statusForKey = useCallback(
		(key) => {
			const entry = CATALOG_BY_KEY[key];
			if (!entry) return {installed: false, appId: null};
			const appId = entry.appIds.find((id) => installedIds[id]);
			return {installed: Boolean(appId), appId: appId ?? null};
		},
		[installedIds],
	);

	return {statusForKey, loading};
}
