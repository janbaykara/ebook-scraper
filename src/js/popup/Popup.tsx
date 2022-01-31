import * as React from "react";
import { useEffect, useState } from "react";
import { Heading, Box, Card, Flex, Text, Button } from "rebass";
import { getURL, getBookURL, getBook } from "../common/utils";
import { Page, ResetButton, Checkbox } from "./Components";
import { createPDF } from './pdf';

const Popup: React.SFC = () => {
  // const [pageNumber, setPageNumber] = useState<number>(undefined);
  const [displayPages, setDisplayPages] = useState<boolean>(false);
  const [book, setBook] = useState<Book>(undefined);

  useEffect(() => {
    try {
      fetchBook();
    } catch (e) {
      // No book to begin with
    }

    chrome.runtime.onMessage.addListener(
      (request: ScraperMessage, sender, sendResponse) => {
        // onMessage must return "true" if response is async.
        let isResponseAsync = false;

        if (request.action === "BookWasUpdated") {
          setBook(request.book || undefined);
        }

        return isResponseAsync;
      }
    );
  }, []);

  const toggleDisplayPages = (_displayPages = !displayPages) =>
    setDisplayPages(_displayPages);

  const fetchBook = (): Promise<Book> => {
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

        setBook(book);

        resolve(book);
      } catch (e) {
        return reject(e);
      }
    });
  };

  const download = async () => {
    if (!book.url) return;
    createPDF(book);
  };

  const reset = async () => {
    if (!book.url) return;
    const message: Messages.ClearBook = {
      action: "ClearBook",
      bookURL: book.url
    };
    return await chrome.runtime.sendMessage(message, fetchBook);
  };

  const updatePageOrder = async (oldIndex: number, newIndex: number) => {
    if (!book.url) return;
    const message: Messages.UpdatePageOrder = {
      action: "UpdatePageOrder",
      bookURL: book.url,
      oldIndex,
      newIndex
    };
    return await chrome.runtime.sendMessage(message, fetchBook);
  };

  return (
    <Box width={250}>
      <Box>
        <Flex justifyContent="between" alignItems="center">
          <Box width={1}>
            <Heading fontSize={2}>Ebook PDF creator 📖</Heading>
          </Box>
          {book && <ResetButton reset={reset}>Reset</ResetButton>}
        </Flex>
        {book && (
          <>
            <Card bg="#EEE" borderRadius={3} my={2}>
              <Text fontSize={1}>
                <b>Book URL:</b> <br />
                <a href={book.url}>{book.url}</a>
              </Text>
            </Card>
            {book.pages.length > 0 ? (
              <Button onClick={download} css={{ width: "100%" }}>
                💾 Download PDF ({book.pages.length} pages)
              </Button>
            ) : (
              <Button disabled>
                Pages will be collected as you navigate through the book
              </Button>
            )}
          </>
        )}
        {book && book.pages && book.pages.length > 0 && (
          <Checkbox
            checked={displayPages}
            onChange={() => toggleDisplayPages()}
          >
            Show pages
          </Checkbox>
        )}
      </Box>
      {displayPages &&
        book &&
        book.pages.map((url, i, arr) => (
          <Page
            url={url}
            moveUp={i > 0 ? () => updatePageOrder(i, i - 1) : undefined}
            moveDown={
              i + 1 < arr.length ? () => updatePageOrder(i, i + 1) : undefined
            }
          />
        ))}
    </Box>
  );
};

export default Popup;
