import { extractPageImageURL } from "../common/utils";
import sites from "../common/sites";
import {
  updatePageAction,
  deleteBook,
  saveBook,
  asyncUpdatePageOrder,
  savePage
} from "./actions";

let lastURL;

chrome.runtime.onInstalled.addListener(() => {
  updatePageAction();

  console.log("XXX");

  // Listen to messages sent from other parts of the extension.
  chrome.runtime.onMessage.addListener(
    async (request: ScraperMessage, sender, sendResponse) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      if (request.action === "ClearBook") {
        isResponseAsync = true;
        lastURL = null;
        deleteBook(request.bookURL, () => {
          sendResponse(null);
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

  // Show page action on the right domain
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
});

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  async function interceptPageResources(request) {
    // Prevent event overloading
    if (lastURL === request.url) return;
    // Ignore requests made by the extension
    if (request.initiator.includes("chrome-extension://")) return;
    lastURL = request.url;

    // Attempt to fetch the underlying image URL (e.g. acquire base64 data urls, image urls, etc.)
    const pageImageURL = await extractPageImageURL(request);
    console.log(pageImageURL)
    if (!pageImageURL) return;
    try {
      return savePage(pageImageURL);
    } catch (e) {
      console.error(e);
    }
  },
  {
    urls: sites.map(site => site.pageResourceURLFilter)
  }
);

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    updatePageAction();
    chrome.action.setBadgeBackgroundColor({ color: "#f45752" });
  }
});