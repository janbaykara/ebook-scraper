import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import Popup from './Popup';

const system = createSystem(defaultConfig);

chrome.tabs.query({ active: true, currentWindow: true }, tab => {
    ReactDOM.render(
        <ChakraProvider value={system}>
            <Popup />
        </ChakraProvider>,
        document.getElementById('popup')
    );
});
