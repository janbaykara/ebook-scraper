import * as React from "react";
import "./Popup.scss";
import { Heading, Box, Card, Flex, Text, Button, Image } from "rebass";
import { getURL, getBookURL, getBook } from "../common/utils";

interface AppProps {}

interface AppState {
  pageNumber?: number;
  book?: Book;
  displayPages: boolean;
}

export default class Popup extends React.Component<AppProps, AppState> {
  state: AppState = {
    displayPages: false
  };

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
          this.setState({ book: request.book || undefined });
        }

        return isResponseAsync;
      }
    );
  }

  toggleDisplayPages = (displayPages = !this.state.displayPages) =>
    this.setState({ displayPages });

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
    return await chrome.runtime.sendMessage(message);
  };

  reset = async () => {
    if (!this.state.book.url) return;
    const message: Messages.ClearBook = {
      action: "ClearBook",
      bookURL: this.state.book.url
    };
    return await chrome.runtime.sendMessage(message, this.fetchBook);
  };

  updatePageOrder = async (oldIndex: number, newIndex: number) => {
    if (!this.state.book.url) return;
    const message: Messages.UpdatePageOrder = {
      action: "UpdatePageOrder",
      bookURL: this.state.book.url,
      oldIndex,
      newIndex
    };
    return await chrome.runtime.sendMessage(message, this.fetchBook);
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
          </>
        )}
        {this.state.book &&
          this.state.book.pages &&
          this.state.book.pages.length > 0 && (
            <Box my={1}>
              <label>
                <input
                  type="checkbox"
                  checked={this.state.displayPages}
                  onChange={() => this.toggleDisplayPages()}
                />
                Show pages
              </label>
            </Box>
          )}
        {this.state.displayPages &&
          this.state.book &&
          this.state.book.pages.map((url, i, arr) => (
            <Flex key={url} alignItems="center">
              <Box>
                <Image src={url} my={1} width={0.95} height="100px" />
              </Box>
              <Flex flexDirection="column" justifyContent="around" width={0.05}>
                {i > 0 && (
                  <Text
                    css={{ cursor: "pointer" }}
                    onClick={() => this.updatePageOrder(i, i - 1)}
                  >
                    ⬆️
                  </Text>
                )}
                {i + 1 < arr.length && (
                  <Text
                    css={{ cursor: "pointer" }}
                    onClick={() => this.updatePageOrder(i, i + 1)}
                  >
                    ⬇️
                  </Text>
                )}
              </Flex>
            </Flex>
          ))}
      </Box>
    );
  }
}
