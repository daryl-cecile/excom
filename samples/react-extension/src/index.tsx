import React from 'react';
import {createRoot} from 'react-dom/client';

import App from './App';

const root = document.createElement('div');
root.id = 'root';
document.body.prepend(root);

createRoot(root).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);