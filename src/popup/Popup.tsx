import * as React from "react";
import "./Popup.scss";
import { Heading, Box, Card, Flex, Text, Button } from "rebass";
import { getURL, getBookURL, getBook } from "../common/utils";

interface AppProps {}

interface AppState {
  pageNumber?: number;
  book?: Book;
}

export default class Popup extends React.Component<AppProps, AppState> {
  state: AppState = {};

  constructor(props: AppProps, state: AppState) {
    super(props, state);
  }

  async componentDidMount() {
    try {
      this.fetchBook();
    } catch (e) {
      // No book to begin with
    }

    chrome.runtime.onMessage.addListener(
      (request: ScraperMessage, sender, sendResponse) => {
        // onMessage must return "true" if response is async.
        let isResponseAsync = false;

        if (request.action === "BookWasUpdated") {
          this.setState({ book: request.book });
        }

        return isResponseAsync;
      }
    );
  }

  fetchBook = async () => {
    const _url = await getURL();

  fetchBook = (): Promise<Book> => {
    console.log("fetching book");
    return new Promise(async (resolve, reject) => {
      try {
        const _url = await getURL();

        if (!_url) {
          console.log("No URL");
          return reject("Couldn't get URL for this book");
        }

        const url = getBookURL(_url);
        let book = await getBook(url);

        if (!book) {
          console.log("No book", book);
          book = { url, pages: [] };
          const message: Messages.SaveBook = { action: "SaveBook", book };
          chrome.runtime.sendMessage(message);
        } else {
          console.log("Received book", book);
        }

        this.setState({ book }, () => console.log("new book", book));

        resolve(book);
      } catch (e) {
        return reject(e);
      }
    });
  };

  download = async () => {
    if (!this.state.book.url) return;
    const message: Messages.RequestDownload = {
      action: "RequestDownload",
      bookURL: this.state.book.url
    };
    await chrome.runtime.sendMessage(message);
  };

  reset = async () => {
    if (!this.state.book.url) return;
    const message: Messages.ClearBook = {
      action: "ClearBook",
      bookURL: this.state.book.url
    };
    await chrome.runtime.sendMessage(message, this.fetchBook);
  };

    if (_url) {
      const url = getBookURL(_url);
      chrome.storage.local.get(url, (store?: LocalStorageData) => {
        const book = store[url];
        if (book && book.pages && book.pages.length) {
          this.setState({ book });
        } else {
          const book: Book = { url, pages: [] };
          const message: Messages.SaveBook = { action: "SaveBook", book };
          chrome.runtime.sendMessage(message);
          this.setState({ book });
        }
      });
    }
  };

  download = async () => {
    if (!this.state.book.url) return;
    const message: Messages.RequestDownload = {
      action: "RequestDownload",
      bookURL: this.state.book.url
    };
    chrome.runtime.sendMessage(message);
  };

  reset = async () => {
    if (!this.state.book.url) return;
    const message: Messages.ClearBook = {
      action: "ClearBook",
      bookURL: this.state.book.url
    };
    chrome.runtime.sendMessage(message, this.fetchBook);
  };

  render() {
    return (
      <Box width={250}>
        <Flex justifyContent="between" alignItems="center">
          <Box width={1}>
            <Heading fontSize={2}>Ebook PDF creator 📖</Heading>
          </Box>
          {this.state.book && (
            <Button
              onClick={this.reset}
              css={{
                "text-align": "right",
                background: "#FAFAFA",
                border: "1px solid red"
              }}
              color="red"
              p={1}
            >
              reset
            </Button>
          )}
        </Flex>
        {this.state.book && (
          <>
            <Card bg="#EEE" borderRadius={3} my={2}>
              <Text fontSize={1}>
                <b>Book URL:</b> <br />
                <a href={this.state.book.url}>{this.state.book.url}</a>
              </Text>
            </Card>
            {this.state.book.pages.length > 0 ? (
              <Button onClick={this.download} css={{ width: "100%" }}>
                💾 Download PDF ({this.state.book.pages.length} pages)
              </Button>
            ) : (
              <Button disabled>
                Pages will be collected as you navigate through the book
              </Button>
            )}
            <Button onClick={this.download} css={{ width: "100%" }}>
              💾 Download PDF ({this.state.book.pages.length} pages)
            </Button>
          </>
        )}
      </Box>
    );
  }
}
