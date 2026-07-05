import {Panels, Panel, Header} from '@enact/sandstone/Panels';
import ThemeDecorator from '@enact/sandstone/ThemeDecorator';

import SearchView from '../views/SearchView.js';

// Root application. Sandstone's ThemeDecorator wires up Spotlight (D-Pad
// navigation), the resolution independence layer and LG native styling.
const App = (props) => (
	<Panels {...props}>
		<Panel>
			<Header
				title="Streaming Finder"
				subtitle="Where can I watch it — on the apps I already have?"
			/>
			<SearchView />
		</Panel>
	</Panels>
);

export default ThemeDecorator(App);
