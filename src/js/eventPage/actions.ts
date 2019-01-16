import {
  getBookURL,
  getURL,
  createPDF,
  getBook,
  move,
  getActiveTab
} from "../common/utils";

export const updatePageAction = async () => {
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

export const asyncUpdatePageOrder: MessageResponse<
  Messages.UpdatePageOrder
> = async ({ oldIndex, newIndex, numPages, bookURL }, sendResponse) => {
  const book = await getBook(bookURL);
  if (!book) return Promise.reject(false);
  book.pages = move(book.pages, oldIndex, newIndex, numPages);
  saveBook(book, () => sendResponse(book));
};

export const asyncDownload: MessageResponse<Messages.RequestDownload> = async (
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

export const savePage = (pageImageURL: string): Promise<boolean> => {
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

export const saveBook = (book: Book, cb = (): any => null) => {
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

export const deleteBook = (bookUrl: string, cb = (): any => null) => {
  chrome.storage.local.remove(bookUrl, () => {
    console.log(`Deleted book: ${bookUrl}`);
    postBookUpdate(false);
    cb();
  });
};

export const postBookUpdate = async (book: Book | false) => {
  const message: Messages.BookWasUpdated = { action: "BookWasUpdated", book };
  updatePageAction();
  return await chrome.runtime.sendMessage(message);
};
