import { updatePageAction, deleteBook, saveBook, asyncUpdatePageOrder, savePage } from '../components/actions';
import sites from '../components/sites';
import type { ScraperMessage } from '../components/types';
import { extractPageImageURL } from '../components/utils';

let lastURL: string | undefined;

export default defineBackground(() => {
  // Action API is conditionally available based on manifest v2 vs v3
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const actionAPI = browser.action || browser.browserAction;

  // Move message listener setup to top level so it persists through service worker wake/sleep cycles
  browser.runtime.onMessage.addListener((request: ScraperMessage, _sender, sendResponse) => {
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

  browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/enabled');
    updatePageAction().catch((e) => {
      console.error('Error updating page action:', e);
    });

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        const url = new URL(tab.url);
        const enabledSites = new Set(
          sites.map((site) =>
            typeof site.readerDomain === 'string'
              ? site.readerDomain
              : site.readerDomain.hostEquals || site.readerDomain.hostContains,
          ),
        );
        const shouldShow =
          enabledSites.has(url.hostname) ||
          Array.from(enabledSites).some((domain) => domain && url.hostname.includes(domain));

        if (shouldShow) {
          actionAPI.enable(tabId).catch((e) => console.error('Error enabling action', e));
        } else {
          actionAPI.disable(tabId).catch((e) => console.error('Error disabling action', e));
        }
      }
    });

    actionAPI.setBadgeBackgroundColor({ color: '#f45752' }).catch((e) => {
      console.error('Error setting badge background color:', e);
    });
  });

  // Also add a startup listener to ensure everything is initialized when the service worker wakes up
  browser.runtime.onStartup.addListener(() => {
    console.log('Service worker starting up');
    updatePageAction().catch((e) => {
      console.error('Error updating page action on startup:', e);
    });
  });

  // Capture ProQuest docImage.action requests
  browser.webRequest.onBeforeRequest.addListener(
    (request): undefined => {
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

  browser.tabs.onUpdated.addListener(function (_tabId, changeInfo) {
    if (changeInfo.status === 'complete') {
      updatePageAction().catch((e) => {
        console.error('Error updating page action on tab update:', e);
      });
      actionAPI.setBadgeBackgroundColor({ color: '#f45752' }).catch((e) => {
        console.error('Error setting badge background color on tab update:', e);
      });
    }
  });

  // Download ebook page images
  browser.webRequest.onCompleted.addListener(
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
});
