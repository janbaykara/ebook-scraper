import sites from '../common/sites';
import { extractPageImageURL } from '../common/utils';
import type { ScraperMessage } from '../types';

import { updatePageAction, deleteBook, saveBook, asyncUpdatePageOrder, savePage } from './actions';

let lastURL: string | undefined;

// Move message listener setup to top level so it persists through service worker wake/sleep cycles
chrome.runtime.onMessage.addListener((request: ScraperMessage, _sender, sendResponse) => {
  console.log('Background received message:', request);
  let isResponseAsync = false;

  if (request.action === 'ClearBook') {
    isResponseAsync = true;
    lastURL = undefined;
    deleteBook(request.bookURL, () => {
      sendResponse({ success: true });
    });
  }

  if (request.action === 'SaveBook') {
    isResponseAsync = true;
    saveBook(request.book, () => sendResponse(request.book));
  }

  if (request.action === 'UpdatePageOrder') {
    isResponseAsync = true;
    asyncUpdatePageOrder(request, sendResponse).catch((error) => {
      console.error('Error updating page order:', error);
    });
  }

  return isResponseAsync;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/enabled');
  updatePageAction().catch((e) => {
    console.error('Error updating page action:', e);
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          ...sites.map(
            (site) =>
              new chrome.declarativeContent.PageStateMatcher({
                pageUrl: site.readerDomain,
              }),
          ),
        ],
        actions: [new chrome.declarativeContent.ShowAction()],
      },
    ]);
  });

  chrome.action.setBadgeBackgroundColor({ color: '#f45752' }).catch((e) => {
    console.error('Error setting badge background color:', e);
  });
});

// Also add a startup listener to ensure everything is initialized when the service worker wakes up
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker starting up');
  updatePageAction().catch((e) => {
    console.error('Error updating page action on startup:', e);
  });
});

// Capture ProQuest docImage.action requests
chrome.webRequest.onBeforeRequest.addListener(
  (request) => {
    try {
      console.log('Web request intercepted:', request.url);

      const url = new URL(request.url);

      // Check if this is a docImage.action URL
      if (!url.pathname.includes('/docImage.action') || !url.searchParams.has('encrypted')) {
        return;
      }

      console.log('Captured page image:', request.url);

      // Save this image URL directly
      savePage(request.url)
        .then(() => {
          updatePageAction().catch((e) => {
            console.error('Error updating page action after saving page:', e);
          });
        })
        .catch((e) => {
          console.error('Error saving page image:', e);
        });
    } catch (e) {
      console.warn('Error processing web request:', e);
    }
  },
  {
    urls: ['*://ebookcentral.proquest.com/*/docImage.action*'],
  },
);

chrome.tabs.onUpdated.addListener(function (_tabId, changeInfo) {
  if (changeInfo.status === 'complete') {
    updatePageAction().catch((e) => {
      console.error('Error updating page action on tab update:', e);
    });
    chrome.action.setBadgeBackgroundColor({ color: '#f45752' }).catch((e) => {
      console.error('Error setting badge background color on tab update:', e);
    });
  }
});

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  function interceptPageResources(request) {
    // Prevent event overloading
    if (lastURL === request.url) {
      return;
    }
    // Ignore requests made by the extension
    if (request.initiator?.includes('chrome-extension://')) {
      return;
    }
    lastURL = request.url;

    // Attempt to fetch the underlying image URL (e.g. acquire base64 data urls, image urls, etc.)
    const pageImageURL = extractPageImageURL(request);
    if (!pageImageURL) {
      return;
    }
    console.log('Page image URL: ', pageImageURL);
    savePage(pageImageURL).catch((e) => {
      console.error('Error saving page image:', e);
    });
  },
  {
    urls: sites.map((site) => site.pageResourceURLFilter),
  },
);
