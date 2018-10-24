type Page = string;

interface Book {
  url: string;
  pages: Page[];
}

declare namespace Messages {
  interface RequestDownload {
    action: 'RequestDownload',
    bookURL: string
  }
  interface SaveBook {
    action: 'SaveBook',
    book: Book
  }
  interface BookWasUpdated {
    action: 'BookWasUpdated',
    book: Book
  }
  interface ClearBook {
    action: 'ClearBook'
    bookURL: string
  }
}

type ScraperMessage =
  | Messages.SaveBook
  | Messages.RequestDownload
  | Messages.BookWasUpdated
  | Messages.ClearBook;

interface LocalStorageData { [key: string]: Book }