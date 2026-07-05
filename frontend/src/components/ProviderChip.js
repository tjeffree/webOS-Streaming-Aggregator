import kind from '@enact/core/kind';
import Button from '@enact/sandstone/Button';
import Icon from '@enact/sandstone/Icon';
import PropTypes from 'prop-types';

import {launchApp} from '../services/webos.js';

import css from './ProviderChip.module.less';

// A single streaming provider for a title, rendered as a content-sized button
// (NOT a full-width Item, which collapses inside a wrapping row). When the
// matching app is installed the button is enabled, Spotlight-focusable and
// launches the app on OK/click; otherwise it's dimmed and skipped by the D-Pad.
const ProviderChip = kind({
	name: 'ProviderChip',

	propTypes: {
		name: PropTypes.string.isRequired,
		installed: PropTypes.bool,
		launchAppId: PropTypes.string,
		monetization: PropTypes.arrayOf(PropTypes.string),
	},

	defaultProps: {
		installed: false,
		monetization: [],
	},

	styles: {
		css,
		className: 'chip',
	},

	computed: {
		className: ({installed, styler}) =>
			styler.append({installed, unavailable: !installed}),
		label: ({name, monetization}) => {
			const m = formatMonetization(monetization);
			return m ? `${name}  ·  ${m}` : name;
		},
		// Only installed apps are launchable.
		handleClick: ({installed, launchAppId}) =>
			installed && launchAppId ? () => launchApp(launchAppId) : null,
	},

	render: ({label, installed, handleClick, className}) => (
		<Button
			className={className}
			size="small"
			minWidth={false}
			disabled={!installed}
			onClick={handleClick}
		>
			<Icon size="tiny" className={css.icon}>
				{installed ? 'check' : 'closex'}
			</Icon>
			{label}
		</Button>
	),
});

// JustWatch monetization codes → friendly words.
const MONETIZATION_LABELS = {
	FLATRATE: 'Subscription',
	FREE: 'Free',
	ADS: 'Free with ads',
	RENT: 'Rent',
	BUY: 'Buy',
	FAST: 'Live channel',
};

function formatMonetization(types) {
	if (!types || types.length === 0) return '';
	const seen = new Set();
	const words = [];
	for (const t of types) {
		const label = MONETIZATION_LABELS[t] || t;
		if (!seen.has(label)) {
			seen.add(label);
			words.push(label);
		}
	}
	return words.join(' · ');
}

export default ProviderChip;
