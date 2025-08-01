import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';

import { Popup } from './Popup';

const system = createSystem(defaultConfig);

chrome.tabs.query({ active: true, currentWindow: true }, () => {
  const container = document.getElementById('popup');
  if (!container) {
    throw Error('Popup container not found');
  }
  const root = createRoot(container);
  root.render(
    <ChakraProvider value={system}>
      <Popup />
    </ChakraProvider>,
  );
});
