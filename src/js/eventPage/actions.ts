import {
  getBookURL,
  getURL,
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

  chrome.action.setBadgeBackgroundColor({color: "#3c3a85"})
  chrome.action.setBadgeText({text: `${book.pages.length}`})
};

export const asyncUpdatePageOrder: MessageResponse<
  Messages.UpdatePageOrder
> = async ({ oldIndex, newIndex, numPages, bookURL }, sendResponse) => {
  const book = await getBook(bookURL);
  if (!book) return Promise.reject(false);
  book.pages = move(book.pages, oldIndex, newIndex, numPages);
  saveBook(book, () => sendResponse(book));
};

export const savePage = (pageImageURL: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const url = await getURL();
    if (!url) {
      console.error({ url })
      return reject("Could not get active tab URL")
    };
    const bookURL = await getBookURL(url);
    if (!bookURL) {
      console.error({ url, bookURL })
      return reject("Could not get book URL")
    };
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
      console.info(`Creating new book`, newBook);
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
