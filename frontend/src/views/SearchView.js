import {useCallback, useState} from 'react';
import BodyText from '@enact/sandstone/BodyText';
import Input from '@enact/sandstone/Input';
import Scroller from '@enact/sandstone/Scroller';
import Spinner from '@enact/sandstone/Spinner';
import {Cell, Column} from '@enact/ui/Layout';

import TitleCard from '../components/TitleCard.js';
import useInstalledApps from '../hooks/useInstalledApps.js';
import {searchTitle} from '../services/api.js';

import css from './SearchView.module.less';

// Main interaction surface: type a title, get back which of your installed
// apps can play it. Installed-app detection runs once on mount (via the Luna
// bus) and is reused to annotate every search.
const SearchView = () => {
	const {statusForKey, loading: appsLoading} = useInstalledApps();

	const [value, setValue] = useState('');
	const [results, setResults] = useState(null);
	const [status, setStatus] = useState('idle'); // idle | loading | error | done
	const [error, setError] = useState('');

	const handleChange = useCallback((ev) => setValue(ev.value), []);

	const runSearch = useCallback(
		async (title) => {
			const trimmed = (title || '').trim();
			if (!trimmed) return;

			setStatus('loading');
			setError('');
			try {
				const data = await searchTitle(trimmed);
				// Annotate each provider with whether its app is on this TV, and
				// which appId to launch if so.
				const annotated = data.results.map((r) => ({
					...r,
					providers: r.providers.map((p) => {
						const {installed, appId} = statusForKey(p.key);
						return {...p, installed, launchAppId: appId};
					}),
				}));
				setResults(annotated);
				setStatus('done');
			} catch (err) {
				setError(err.message);
				setStatus('error');
			}
		},
		[statusForKey],
	);

	const handleComplete = useCallback((ev) => runSearch(ev.value), [runSearch]);

	return (
		<Column className={css.view}>
			<Cell shrink>
				<Input
					placeholder="Search for a film or TV show…"
					value={value}
					onChange={handleChange}
					onComplete={handleComplete}
					iconAfter="search"
				/>
			</Cell>
			<Cell>
				<Scroller>
					<Body
						status={status}
						appsLoading={appsLoading}
						error={error}
						results={results}
					/>
				</Scroller>
			</Cell>
		</Column>
	);
};

// Result-area body, split out to keep the render branches readable.
const Body = ({status, appsLoading, error, results}) => {
	if (status === 'loading' || (status === 'idle' && appsLoading)) {
		return <Spinner>Searching…</Spinner>;
	}
	if (status === 'error') {
		return (
			<BodyText className={css.error}>
				Couldn’t reach the aggregator: {error}
			</BodyText>
		);
	}
	if (status === 'idle') {
		return (
			<BodyText>
				Type a title above and press OK to see which of your installed apps
				can play it.
			</BodyText>
		);
	}
	if (!results || results.length === 0) {
		return <BodyText>No matches found.</BodyText>;
	}
	return results.map((r) => (
		<TitleCard key={`${r.title}-${r.year}`} {...r} />
	));
};

export default SearchView;
