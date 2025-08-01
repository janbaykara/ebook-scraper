import { getBookURL, getURL, getBook, move, getActiveTab } from '../common/utils';
import type { Book, BookWasUpdated, UpdatePageOrder } from '../types';

export const updatePageAction = async () => {
  const tab = await getActiveTab();
  const url = await getURL();
  if (!url) {
    throw new Error();
  }
  const bookURL = getBookURL(url);
  if (!bookURL) {
    return;
  }
  const book = await getBook(bookURL);
  if (!book || !tab || !tab.id) {
    return;
  }

  if (book.pages && book.pages.length > 999) {
    chrome.action.setBadgeText({ text: '999+', tabId: tab.id }).catch((error) => {
      console.error('Error setting badge text:', error);
    });
  } else {
    chrome.action.setBadgeText({ text: `${book.pages?.length}`, tabId: tab.id }).catch((error) => {
      console.error('Error setting badge text:', error);
    });
  }
};

export async function asyncUpdatePageOrder(
  { oldIndex, newIndex, numPages, bookURL }: UpdatePageOrder,
  sendResponse: (data: unknown) => void,
): Promise<void> {
  const book = await getBook(bookURL);

  if (!book) {
    return sendResponse(false);
  }

  move(book.pages ?? [], oldIndex, newIndex, numPages);

  chrome.storage.local.set({ [bookURL]: book }, () => {
    chrome.runtime
      .sendMessage({
        action: 'BookWasUpdated',
        book,
      } as BookWasUpdated)
      .catch((error) => {
        console.error('Error sending book update message:', error);
      });

    sendResponse(book);
  });
}

export async function savePage(pageImageURL: string): Promise<void> {
  console.log('savePage called with:', pageImageURL);

  try {
    // Get the current tab to determine the book URL
    const tab = await getActiveTab();
    if (!tab || !tab.url) {
      console.log('No active tab found');
      return;
    }

    const currentURL = new URL(tab.url);
    const bookURL = getBookURL(currentURL);

    if (!bookURL) {
      console.log('Could not determine book URL from:', tab.url);
      return;
    }

    console.log('Saving page to book:', bookURL);

    // Get or create the book
    let book = await getBook(bookURL);
    if (!book) {
      book = { url: bookURL, pages: [] };
      console.log('Created new book for:', bookURL);
    }

    // Add the page if it's not already there
    if (!book.pages?.includes(pageImageURL)) {
      book.pages?.push(pageImageURL);
      console.log('Added page to book. Total pages:', book.pages?.length);

      // Save the updated book
      chrome.storage.local.set({ [bookURL]: book }, () => {
        console.log('Book saved to storage');

        // Notify popup of update
        chrome.runtime
          .sendMessage({
            action: 'BookWasUpdated',
            book,
          } as BookWasUpdated)
          .catch((error) => {
            console.error('Error sending book update message:', error);
          });

        return true;
      });
    } else {
      console.log('Page already exists in book');
      return;
    }
  } catch (e) {
    console.error('Error in savePage:', e);
    throw e;
  }
}

export const saveBook = (book: Book, cb = (): unknown => null) => {
  chrome.storage.local.set({ [book.url]: book }, cb);
};

export const deleteBook = (bookUrl: string, cb = (): unknown => null) => {
  chrome.storage.local.remove(bookUrl, () => {
    console.log(`Deleted book: ${bookUrl}`);
    postBookUpdate(false).catch((error) => {
      console.error('Error posting book update after deletion:', error);
    });
    cb();
  });
};

export const postBookUpdate = async (book: Book | false): Promise<unknown> => {
  const message: BookWasUpdated = { action: 'BookWasUpdated', book };
  updatePageAction().catch((error) => {
    console.error('Error updating page action after book update:', error);
  });
  return await chrome.runtime.sendMessage<unknown, unknown>(message);
};
