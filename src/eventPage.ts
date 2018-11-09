import {
  extractPageImageURL,
  getBookURL,
  getURL,
  createPDF,
  getBook,
  move,
  getActiveTab
} from "./common/utils";

const ebookReaderDomains = [
  "dawsonera.com/readonline",
  "ebookcentral.proquest.com/lib",
  "jstor.org/stable/"
];

let lastURL;

chrome.runtime.onInstalled.addListener(() => {
  // Listen to messages sent from other parts of the extension.
  chrome.runtime.onMessage.addListener(
    async (request: ScraperMessage, sender, sendResponse) => {
      // onMessage must return "true" if response is async.
      let isResponseAsync = false;

      if (request.action === "ClearBook") {
        isResponseAsync = true;
        lastURL = null;
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

const savePage = async (pageImageURL: string) => {
  return new Promise(async resolve => {
    const bookURL = await getBookURL(await getURL());
    chrome.storage.local.get(bookURL, (store?: LocalStorageData) => {
      const book = store[bookURL];

      // Predicates
      const bookIsValid = !!book && book.pages && Array.isArray(book.pages);
      if (bookIsValid) {
        const pageIsAlreadyInTheBook = book.pages.indexOf(pageImageURL) > -1;
        if (pageIsAlreadyInTheBook) return resolve();
        // Try to append images to existing books
        console.info(`Updating book ${book.url} (${book.pages.length})`);
        book.pages.push(pageImageURL);
        book.pages = Array.from(new Set(book.pages));
        chrome.storage.local.set(
          { [bookURL]: book },
          () => void resolve() && postBookUpdate(book)
        );
      } else {
        // Or else start a new one init
        const newBook: Book = { url: bookURL, pages: [pageImageURL] };
        console.info(
          `Creating new book ${newBook.url} (${newBook.pages.length})`
        );
        chrome.storage.local.set(
          { [bookURL]: newBook },
          () => void resolve() && postBookUpdate(book)
        );
      }
    });
  });
};

const postBookUpdate = (book: Book) => {
  const message: Messages.BookWasUpdated = { action: "BookWasUpdated", book };
  chrome.runtime.sendMessage(message);
};

const interceptPageResources = async (
  request: chrome.webRequest.WebResponseCacheDetails
) => {
  // Prevent event overloading
  if (lastURL === request.url) return;
  lastURL = request.url;

  // Attempt to fetch the underlying image URL (e.g. acquire base64 data urls, image urls, etc.)
  const pageImageURL = await extractPageImageURL(request);
  if (!pageImageURL) return;
  return savePage(pageImageURL);
};

const pageResourceURLFilter: chrome.webRequest.RequestFilter = {
  urls: ["*://*.dawsonera.com/*", "*://*.proquest.com/*", "*://*.jstor.org/*"]
};

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  interceptPageResources,
  pageResourceURLFilter
);
