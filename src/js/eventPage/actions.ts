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
  if (!bookURL) return;
  const book = await getBook(bookURL);
  if (!book || !tab || !tab.id) return;

  if (book.pages.length > 999) {
    chrome.action.setBadgeText({ text: "999+", tabId: tab.id })
  } else {
    chrome.action.setBadgeText({ text: `${book.pages.length}`, tabId: tab.id })
  }
};

export const asyncUpdatePageOrder: MessageResponse<
  Messages.UpdatePageOrder
> = async ({ oldIndex, newIndex, numPages, bookURL }, sendResponse) => {
  const book = await getBook(bookURL);

  if (!book) return sendResponse(false);

  move(book.pages, oldIndex, newIndex, numPages);

  chrome.storage.local.set({ [bookURL]: book }, () => {
    chrome.runtime.sendMessage({
      action: "BookWasUpdated",
      book
    } as Messages.BookWasUpdated);

    sendResponse(book);
  });
};

export const savePage = (pageImageURL: string): Promise<boolean> => {
  console.log("savePage called with:", pageImageURL);

  return new Promise(async (resolve, reject) => {
    try {
      // Get the current tab to determine the book URL
      const tab = await getActiveTab();
      if (!tab || !tab.url) {
        console.log("No active tab found");
        return resolve(false);
      }

      const currentURL = new URL(tab.url);
      const bookURL = getBookURL(currentURL);

      if (!bookURL) {
        console.log("Could not determine book URL from:", tab.url);
        return resolve(false);
      }

      console.log("Saving page to book:", bookURL);

      // Get or create the book
      let book = await getBook(bookURL);
      if (!book) {
        book = { url: bookURL, pages: [] };
        console.log("Created new book for:", bookURL);
      }

      // Add the page if it's not already there
      if (!book.pages.includes(pageImageURL)) {
        book.pages.push(pageImageURL);
        console.log("Added page to book. Total pages:", book.pages.length);

        // Save the updated book
        chrome.storage.local.set({ [bookURL]: book }, () => {
          console.log("Book saved to storage");

          // Notify popup of update
          chrome.runtime.sendMessage({
            action: "BookWasUpdated",
            book
          } as Messages.BookWasUpdated);

          resolve(true);
        });
      } else {
        console.log("Page already exists in book");
        resolve(false);
      }
    } catch (e) {
      console.error("Error in savePage:", e);
      reject(e);
    }
  });
};

export const saveBook = (book: Book, cb = (): any => null) => {
  chrome.storage.local.set({ [book.url]: book }, cb);
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
