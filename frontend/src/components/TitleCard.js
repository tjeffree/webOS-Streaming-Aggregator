import kind from '@enact/core/kind';
import BodyText from '@enact/sandstone/BodyText';
import Heading from '@enact/sandstone/Heading';
import {Cell, Row} from '@enact/ui/Layout';
import PropTypes from 'prop-types';

import ProviderChip from './ProviderChip.js';

import css from './TitleCard.module.less';

// One search result: a title plus the providers that carry it. Providers are
// sorted so installed apps float to the top.
const TitleCard = kind({
	name: 'TitleCard',

	propTypes: {
		providers: PropTypes.array.isRequired,
		title: PropTypes.string.isRequired,
		type: PropTypes.string,
		year: PropTypes.number,
	},

	defaultProps: {
		providers: [],
	},

	styles: {
		css,
		className: 'card',
	},

	computed: {
		heading: ({title, year}) => (year ? `${title} (${year})` : title),
		sortedProviders: ({providers}) =>
			[...providers].sort(
				(a, b) => Number(b.installed) - Number(a.installed),
			),
		installedCount: ({providers}) =>
			providers.filter((p) => p.installed).length,
	},

	render: ({heading, type, sortedProviders, installedCount, ...rest}) => {
		delete rest.providers;
		delete rest.title;
		delete rest.year;
		return (
			<div {...rest}>
				<Heading showLine>{heading}</Heading>
				<BodyText size="small" className={css.summary}>
					{summaryLine(type, installedCount, sortedProviders.length)}
				</BodyText>
				{sortedProviders.length === 0 ? (
					<BodyText>Not available on any tracked service.</BodyText>
				) : (
					<Row wrap>
						{sortedProviders.map((p) => (
							<Cell shrink key={p.technicalName || p.name}>
								<ProviderChip {...p} />
							</Cell>
						))}
					</Row>
				)}
			</div>
		);
	},
});

function summaryLine(type, installedCount, total) {
	const kindWord = type === 'SHOW' ? 'TV series' : 'Film';
	if (total === 0) return kindWord;
	if (installedCount === 0) {
		return `${kindWord} · on ${total} service${total === 1 ? '' : 's'} (none installed)`;
	}
	return `${kindWord} · playable now on ${installedCount} of your apps`;
}

export default TitleCard;
