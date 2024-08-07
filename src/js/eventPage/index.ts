import { extractPageImageURL } from "../common/utils";
import sites from "../common/sites";
import {
  updatePageAction,
  deleteBook,
  saveBook,
  asyncUpdatePageOrder,
  savePage
} from "./actions";

// Listen for messages from the popup
let lastURL: string | null = null;

chrome.runtime.onInstalled.addListener(() => {
  updatePageAction();
  console.log("Extension installed and pahe action updated");

  // Listen to messages sent from other parts of the extension.
  chrome.runtime.onMessage.addListener(
    async (request: ScraperMessage, sender, sendResponse) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      switch (request.action) {
        case "ClearBook":
          isResponseAsync = true;
          lastURL = null;
          deleteBook(request.bookURL, () => {
            sendResponse(null);
          });
          break;

        case "SaveBook":
          isResponseAsync = true;
          saveBook(request.book, () => sendResponse(request.book));
          break;

        case "UpdatePageOrder":
          isResponseAsync = true;
          asyncUpdatePageOrder(request, sendResponse);
          break;

        default:
          console.warn("Unknown action:", request.action);
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

  chrome.action.setBadgeBackgroundColor({ color: "#f45752" });
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

// Update when the page loads to show current page count
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    updatePageAction();
    chrome.action.setBadgeBackgroundColor({ color: "#f45752" });
  }
});
// Ping interval to send status message every 10 seconds
const pingInterval = setInterval(() => {
  chrome.runtime.sendMessage({
    status: "ping",
  });
}, 10000); // Ping every 10 seconds

// Clear the interval when the extension or page is unloaded
chrome.runtime.onSuspend.addListener(() => {
  clearInterval(pingInterval);
  console.log("Extension unloaded, ping interval cleared.");
});