import {createRoot} from 'react-dom/client';

import App from './App/App.js';

const appElement = <App />;

// In a browser environment, render into the DOM (enact serve / webOS webview).
if (typeof window !== 'undefined') {
	const container = document.getElementById('root');
	const root = createRoot(container);
	root.render(appElement);
}

export default appElement;
