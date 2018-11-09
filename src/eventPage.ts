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
  updatePageAction();

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
  saveBook(book, () => sendResponse(book));
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

const savePage = (pageImageURL: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const url = await getURL();
    if (!url) return reject();
    const bookURL = await getBookURL(url);
    const book = await getBook(bookURL);
    const bookIsValid = !!book && book.pages && Array.isArray(book.pages);
    if (bookIsValid) {
      const pageIsAlreadyInTheBook = book.pages.indexOf(pageImageURL) > -1;
      if (pageIsAlreadyInTheBook) return resolve(true);
      // Try to append images to existing books
      book.pages.push(pageImageURL);
      book.pages = Array.from(new Set(book.pages));
      console.info(`Updating book`);
      saveBook(book, () => resolve(true));
    } else {
      // Or else start a new one init
      const newBook: Book = { url: bookURL, pages: [pageImageURL] };
      console.info(`Creating new book`);
      saveBook(newBook, () => resolve(true));
    }
  });
};

const saveBook = (book: Book, cb = (): any => null) => {
  if (
    !(
      book &&
      book.url &&
      book.url !== "undefined" &&
      typeof book.url !== "undefined"
    )
  ) {
    return;
  }
  chrome.storage.local.set({ [book.url]: book }, () => {
    console.log(`Saved book: ${book.url} (${book.pages.length})`);
    postBookUpdate(book);
    cb();
  });
};

const deleteBook = (bookUrl: string, cb = (): any => null) => {
  chrome.storage.local.remove(bookUrl, () => {
    console.log(`Deleted book: ${bookUrl}`);
    postBookUpdate(false);
    cb();
  });
};

const postBookUpdate = async (book: Book | false) => {
  const message: Messages.BookWasUpdated = { action: "BookWasUpdated", book };
  updatePageAction();
  return await chrome.runtime.sendMessage(message);
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
  try {
    return savePage(pageImageURL);
  } catch (e) {
    console.error(e);
  }
};

const pageResourceURLFilter: chrome.webRequest.RequestFilter = {
  urls: ["*://*.dawsonera.com/*", "*://*.proquest.com/*", "*://*.jstor.org/*"]
};

// Download ebook page images
chrome.webRequest.onCompleted.addListener(
  interceptPageResources,
  pageResourceURLFilter
);

const updatePageAction = async () => {
  const tab = await getActiveTab();
  const url = await getURL();
  if (!url) throw new Error();
  const bookURL = await getBookURL(url);
  const book = await getBook(bookURL);
  if (!book || !tab) return;

  var canvas = document.createElement("canvas");
  var img = document.createElement("img");

  img.onload = function() {
    var ctx = canvas.getContext("2d");

    /* Page count */
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText(`${book.pages.length}`, 0, 35);

    chrome.pageAction.setIcon({
      imageData: ctx.getImageData(0, 0, 50, 50),
      tabId: tab.id
    });
  };
  img.src = "icon.png";
};
