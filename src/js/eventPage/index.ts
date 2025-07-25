import { extractPageImageURL } from "../common/utils";
import sites from "../common/sites";
import {
  updatePageAction,
  deleteBook,
  saveBook,
  asyncUpdatePageOrder,
  savePage
} from "./actions";

let lastURL: string | undefined;

// Move message listener setup to top level so it persists through service worker wake/sleep cycles
chrome.runtime.onMessage.addListener(
  async (request: ScraperMessage, sender, sendResponse) => {
    console.log("Background received message:", request);
    let isResponseAsync = false;

    if (request.action === "ClearBook") {
      isResponseAsync = true;
      lastURL = undefined;
      deleteBook(request.bookURL, () => {
        sendResponse({ success: true });
      });
    }

    if (request.action === "SaveBook") {
      isResponseAsync = true;
      saveBook(request.book, () => sendResponse(request.book));
    }

    if (request.action === "UpdatePageOrder") {
      isResponseAsync = true;
      asyncUpdatePageOrder(request, sendResponse);
    }

    return isResponseAsync;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/enabled");
  updatePageAction();

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          ...sites.map(
            site =>
              new chrome.declarativeContent.PageStateMatcher({
                pageUrl: site.readerDomain
              })
          )
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }
    ]);
  });

  chrome.action.setBadgeBackgroundColor({ color: "#f45752" });
});

// Also add a startup listener to ensure everything is initialized when the service worker wakes up
chrome.runtime.onStartup.addListener(() => {
  console.log("Service worker starting up");
  updatePageAction();
});

// Capture ProQuest docImage.action requests
chrome.webRequest.onBeforeRequest.addListener(
  (request) => {
    Promise.resolve().then(async () => {
      try {
        console.log("Web request intercepted:", request.url);

        const url = new URL(request.url);

        // Check if this is a docImage.action URL
        if (!url.pathname.includes('/docImage.action') || !url.searchParams.has('encrypted')) {
          return;
        }

        console.log("Captured page image:", request.url);

        // Save this image URL directly
        await savePage(request.url);
        updatePageAction();
      } catch (e) {
        console.warn("Error processing web request:", e);
      }
    });
  },
  {
    urls: ["*://ebookcentral.proquest.com/*/docImage.action*"]
  }
);

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    updatePageAction();
    chrome.action.setBadgeBackgroundColor({ color: "#f45752" });
  }
});

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  async function interceptPageResources(request) {
    // Prevent event overloading
    if (lastURL === request.url) return;
    // Ignore requests made by the extension
    if (request.initiator?.includes("chrome-extension://")) return;
    lastURL = request.url;

    // Attempt to fetch the underlying image URL (e.g. acquire base64 data urls, image urls, etc.)
    const pageImageURL = await extractPageImageURL(request);
    console.log(pageImageURL)
    if (!pageImageURL) return;
    try {
      return await savePage(pageImageURL);
    } catch (e) {
      console.error(e);
    }
  },
  {
    urls: sites.map(site => site.pageResourceURLFilter)
  }
);