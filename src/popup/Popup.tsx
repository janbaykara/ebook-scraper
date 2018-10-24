import * as React from "react";
import "./Popup.scss";
import { Heading, Box, Text } from "rebass";
import { getURL, getBookURL } from "../common/utils";

interface Page {
    number: number
    url?: string
    requestId?: string
}

interface Book {
    url: string
    pages: Page[]
}

interface AppProps {}

interface AppState {
  pageNumber?: number;
  book?: Book
}

export default class Popup extends React.Component<AppProps, AppState> {
  constructor(props: AppProps, state: AppState) {
    super(props, state);
  }

  async componentDidMount() {
    const _url = await getURL()

    if (_url) {
        const url = getBookURL(_url)
        chrome.storage.local.get(url, (book?: Book) => {
            this.setState({ book })
        });
    }
  }

  state = { pageNumber: undefined, book: undefined };

  setPageNumber = (pageNumber: number) => {
    this.setState({ pageNumber });
    chrome.runtime.sendMessage({ nextPage: {
        
    } });
  };

  render() {
    return (
      <div>
        <Heading>Ebook scraper: online 🔥</Heading>
        <Box>
          <Text>What page are you on?</Text>
          <input
            type="number"
            onChange={e => this.setPageNumber(Number(e.target.value))}
          />
        </Box>
      </div>
    );
  }
}