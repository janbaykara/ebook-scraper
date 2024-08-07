import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Popup from './Popup';

chrome.tabs.query({ active: true, currentWindow: true }, tab => {
    ReactDOM.render(<Popup />, document.getElementById('popup'));
});

chrome.tabs.query({ active: true, currentWindow: true }, tab => {
    console.log('Tab:', tab); // Check if the tab is being queried correctly
    const rootElement = document.getElementById('popup');
    console.log('Root Element:', rootElement); // Check if the root element is found
    if (rootElement) {
        ReactDOM.render(<Popup />, rootElement);
    } else {
        console.error('Root element not found');
    }
});