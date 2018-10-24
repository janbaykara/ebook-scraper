import { isPageUrl, getBookURL, getURL, createPDF } from "./common/utils";

const ebookReaderDomains = [
  "dawsonera.com/readonline",
  "ebookcentral.proquest.com/lib"
];

chrome.runtime.onInstalled.addListener(() => {
  // Listen to messages sent from other parts of the extension.
  chrome.runtime.onMessage.addListener(
    (request: ScraperMessage, sender, sendResponse) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      if (request.action === 'ClearBook') {isResponseAsync
        isResponseAsync = true
        chrome.storage.local.remove(request.bookURL, () => sendResponse(null))
      }

      if (request.action === "SaveBook") {
        chrome.storage.local.set({ [request.book.url]: request.book });
      }

      if (request.action === 'RequestDownload') {
        console.info('Download requested!')

        chrome.storage.local.get(
          request.bookURL,
          (store?: LocalStorageData) => {
            const book = store[request.bookURL];
            if (book) {
              createPDF(book);
            }
          }
        );
      }

      return isResponseAsync;
    }
  );

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

const postBookUpdate = (book: Book) => {
  const message: Messages.BookWasUpdated = { action: 'BookWasUpdated', book };
  chrome.runtime.sendMessage(message);
};

const interceptPageResources = async (
  request: chrome.webRequest.WebResponseCacheDetails
) => {
  if (isPageUrl(new URL(request.url))) {
    const bookURL = await getBookURL(await getURL());
    chrome.storage.local.get(bookURL, (store?: LocalStorageData) => {
      const book = store[bookURL];
      if (book && book.pages && Array.isArray(book.pages)) {
        console.info(`Updating book ${book.url} (${book.pages.length})`);
        book.pages.push(request.url);
        book.pages = Array.from(new Set(book.pages))
        chrome.storage.local.set({ [bookURL]: book }, () =>
          postBookUpdate(book)
        );
      } else {
        const newBook: Book = { url: bookURL, pages: [request.url] };
        console.info(
          `Creating new book ${newBook.url} (${newBook.pages.length})`
        );
        chrome.storage.local.set(
          {
            [bookURL]: newBook
          },
          () => postBookUpdate(book)
        );
      }
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
