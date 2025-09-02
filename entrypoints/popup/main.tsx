import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import './variableDarkModeRoot.css';
import './App.css';

import { App } from './App';

const system = createSystem(defaultConfig);

const container = document.getElementById('root');
if (!container) {
  throw Error('App container not found');
}
const root = ReactDOM.createRoot(container);
root.render(
  <ChakraProvider value={system}>
    <App />
  </ChakraProvider>,
);
