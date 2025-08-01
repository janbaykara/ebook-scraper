export type Page = string;

export type Book = {
  url: string;
  pages?: Page[];
};

type MessageEvent = {
  action: string;
};

export type SaveBook = MessageEvent & {
  action: 'SaveBook';
  book: Book;
};
export type BookWasUpdated = MessageEvent & {
  action: 'BookWasUpdated';
  book: Book | false;
};

export type ClearBook = MessageEvent & {
  action: 'ClearBook';
  bookURL: string;
};

export type UpdatePageOrder = MessageEvent & {
  action: 'UpdatePageOrder';
  bookURL: string;
  oldIndex: number;
  newIndex: number;
  numPages?: number;
};

export type ScraperMessage = SaveBook | BookWasUpdated | ClearBook | UpdatePageOrder;

export type MessageResponse<T extends ScraperMessage = ScraperMessage> = (
  request: T,
  sendResponse: (data: unknown) => void,
) => void;

export type LocalStorageData = {
  [key: string]: Book;
};
