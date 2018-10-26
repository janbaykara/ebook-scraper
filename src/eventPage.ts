import {
  isPageUrl,
  getBookURL,
  getURL,
  createPDF,
  getBook,
  move
} from "./common/utils";

const ebookReaderDomains = [
  "dawsonera.com/readonline",
  "ebookcentral.proquest.com/lib"
];

chrome.runtime.onInstalled.addListener(() => {
  // Listen to messages sent from other parts of the extension.
  chrome.runtime.onMessage.addListener(
    async (request: ScraperMessage, sender, sendResponse) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      if (request.action === "ClearBook") {
        isResponseAsync = true;
        chrome.storage.local.remove(request.bookURL, () => {
          console.log("deleted!");
          sendResponse(null);
        });
      }

      if (request.action === "SaveBook") {
        isResponseAsync = true;
        chrome.storage.local.set({ [request.book.url]: request.book }, () =>
          sendResponse(request.book)
        );
      }

      if (request.action === "UpdatePageOrder") {
        isResponseAsync = true;
        asyncUpdatePageOrder(request, sendResponse);
      }

      if (request.action === "RequestDownload") {
        isResponseAsync = true;
        asyncDownload(request, sendResponse);
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

const asyncUpdatePageOrder: MessageResponse<Messages.UpdatePageOrder> = async (
  { oldIndex, newIndex, numPages, bookURL },
  sendResponse
) => {
  const book = await getBook(bookURL);
  if (!book) return Promise.reject(false);
  book.pages = move(book.pages, oldIndex, newIndex, numPages);
  chrome.storage.local.set({ [bookURL]: book }, () => sendResponse(book));
};

const asyncDownload: MessageResponse<Messages.RequestDownload> = async (
  { bookURL },
  sendResponse
) => {
  const book = await getBook(bookURL);
  if (book) {
    createPDF(book);
    sendResponse(book);
  }
  sendResponse(false);
};

const postBookUpdate = (book: Book) => {
  const message: Messages.BookWasUpdated = { action: "BookWasUpdated", book };
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
        book.pages = Array.from(new Set(book.pages));
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
