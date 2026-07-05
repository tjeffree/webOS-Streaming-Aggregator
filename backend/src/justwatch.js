import {config} from './config.js';

// JustWatch moved to a GraphQL-only API; the old REST wrappers (justwatch-api)
// hit the retired /content endpoints and no longer work. We talk to the current
// endpoint directly. This is an undocumented/private API — no auth is required,
// but it can change without notice, so we keep the query self-contained and the
// mapping (providers.js) keyed on the stable numeric packageId.

// Operation is named GetSearchTitles but queries `popularTitles` with the search
// term in the filter; offers come back inline (no second round-trip needed).
const SEARCH_QUERY = `
query GetSearchTitles(
	$searchTitlesFilter: TitleFilter!,
	$country: Country!,
	$language: Language!,
	$first: Int!,
	$formatPoster: ImageFormat,
	$profile: PosterProfile,
	$filter: OfferFilter!,
	$offset: Int = 0,
) {
	popularTitles(
		country: $country
		filter: $searchTitlesFilter
		first: $first
		sortBy: POPULAR
		sortRandomSeed: 0
		offset: $offset
	) {
		edges {
			node { ...TitleDetails __typename }
			__typename
		}
		__typename
	}
}

fragment TitleDetails on MovieOrShowOrSeasonOrEpisode {
	id
	objectId
	objectType
	content(country: $country, language: $language) {
		title
		originalReleaseYear
		shortDescription
		... on MovieOrShowOrSeasonContent {
			fullPath
			posterUrl(profile: $profile, format: $formatPoster)
		}
		__typename
	}
	offers(country: $country, platform: WEB, filter: $filter) {
		...TitleOffer
	}
	__typename
}

fragment TitleOffer on Offer {
	id
	monetizationType
	presentationType
	standardWebURL
	package { ...PackageDetails }
	__typename
}

fragment PackageDetails on Package {
	id
	packageId
	clearName
	technicalName
	shortName
	__typename
}
`;

/**
 * Search JustWatch for a title and return normalised nodes.
 * @param {string} title
 * @param {{country?: string, language?: string, first?: number}} opts
 * @returns {Promise<Array<{title, year, type, posterUrl, path, offers}>>}
 */
export async function searchTitle(title, opts = {}) {
	const {
		country = config.country,
		language = config.language,
		first = 10,
	} = opts;

	const body = {
		operationName: 'GetSearchTitles',
		variables: {
			first,
			searchTitlesFilter: {
				searchQuery: title,
				includeTitlesWithoutUrl: true,
				releaseYear: {min: null, max: null},
			},
			formatPoster: 'JPG',
			profile: 'S718',
			// bestOnly collapses SD/HD/4K duplicates to one offer per provider.
			filter: {bestOnly: true},
			country,
			language,
		},
		query: SEARCH_QUERY,
	};

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		config.upstreamTimeoutMs,
	);

	let json;
	try {
		const res = await fetch(config.justwatchEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// A realistic UA isn't strictly required but reduces the chance
				// of being blocked by the private API.
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				Accept: 'application/json',
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`JustWatch HTTP ${res.status}: ${text.slice(0, 200)}`);
		}
		json = await res.json();
	} finally {
		clearTimeout(timeout);
	}

	if (json.errors) {
		throw new Error(`JustWatch GraphQL error: ${JSON.stringify(json.errors)}`);
	}

	const edges = json?.data?.popularTitles?.edges ?? [];
	return edges
		.map((e) => e.node)
		.filter(Boolean)
		.map((node) => ({
			title: node.content?.title ?? 'Unknown',
			year: node.content?.originalReleaseYear ?? null,
			type: node.objectType ?? null,
			posterUrl: node.content?.posterUrl ?? null,
			path: node.content?.fullPath ?? null,
			offers: node.offers ?? [],
		}));
}
