type Page = string;

interface Book {
  url: string;
  pages: Page[];
}

declare namespace Messages {
  interface SaveBook {
    action: "SaveBook";
    book: Book;
  }
  interface BookWasUpdated {
    action: "BookWasUpdated";
    book: Book | false;
  }
  interface ClearBook {
    action: "ClearBook";
    bookURL: string;
  }
  interface UpdatePageOrder {
    action: "UpdatePageOrder";
    bookURL: string;
    oldIndex: number;
    newIndex: number;
    numPages?: number;
  }
}

type ScraperMessage =
  | Messages.SaveBook
  | Messages.BookWasUpdated
  | Messages.ClearBook
  | Messages.UpdatePageOrder;

type MessageResponse<T extends ScraperMessage = ScraperMessage> = (
  request: T,
  sendResponse: (data: any) => void
) => void;
interface LocalStorageData {
  [key: string]: Book;
}
