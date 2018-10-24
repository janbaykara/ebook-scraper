import { isPageUrl } from "./common/utils";

// https://ebookcentral.proquest.com/lib/soas-ebooks/reader.action?docID=415063&query
//  -> https://ebookcentral.proquest.com/lib/soas-ebooks/docImage.action?encrypted=zbaP10JVQUj1c0Tns1h5DqV-zsjMU0
// https://ebookcentral.proquest.com/lib/soas-ebooks/reader.action?docID=3301421&ppg=81&tm=1538179138535
//  -> https://ebookcentral.proquest.com/lib/soas-ebooks/docImage.action?encrypted=Q1Pks1Dr26P0OMbOJ*Je1zb1NzZXp0h1miB-

// https://www.dawsonera.com/readonline/9786000018894
//  -> https://www.dawsonera.com/reader/sessionid_1540377357108/page/MS83MTM3LzMvMA==

const ebookReaderDomains = [
  "dawsonera.com/readonline",
  "ebookcentral.proquest.com/lib"
];

chrome.runtime.onInstalled.addListener(() => {
  // Listen to messages sent from other parts of the extension.
//   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     // onMessage must return "true" if response is async.
//     let isResponseAsync = false;

//     if (request.popupMounted) {
//       console.log("eventPage notified that Popup.tsx has mounted.");
//     }

//     return isResponseAsync;
//   });

  // Show page action on the right domain
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          ...ebookReaderDomains.map(
            path =>
              new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {
                  urlContains: path
                }
              })
          )
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

const interceptPageResources = (
  request: chrome.webRequest.WebResponseCacheDetails
) => {
  if (request.type === "image" && isPageUrl(new URL(request.url))) {
    // Store the page in local storage
    chrome.storage.local.set({ [request.requestId]: request }, () => {
      console.log(request)
      chrome.downloads.download({ url: request. url })
    });
  }
};

const pageResourceURLFilter: chrome.webRequest.RequestFilter = {
  urls: ["*://*.dawsonera.com/*", "*://*.proquest.com/*"],
  types: ["image"]
};

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  interceptPageResources,
  pageResourceURLFilter
);
