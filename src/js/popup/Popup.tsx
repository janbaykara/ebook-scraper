import { useState, useEffect, useRef} from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
} from "@chakra-ui/react";
import { Page, ResetButton, Checkbox } from "./Components";
import { createPDF } from "./pdf";
import { getURL, getBookURL, getBook } from "../common/utils";

function Popup() {
  console.log("Popup component rendering...");

  const [displayPages, setDisplayPages] = useState<boolean>(false);
  const [book, setBook] = useState<Book | undefined>(undefined);
  const [progress, setProgress] = useState<number>(0);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, msg]);
  };

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Popup useEffect running...");

    try {
      fetchBook();
    } catch (e) {
      console.error("Error in fetchBook:", e);
    }

    chrome.runtime.onMessage.addListener((request: ScraperMessage) => {
      console.log("Popup received message:", request);

        let isResponseAsync = false;
        if (request.action === "BookWasUpdated") {
          setBook(request.book || undefined);
          console.log("Book updated from message");
        }
        return isResponseAsync;
      }
    );
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [log]);

  const toggleDisplayPages = (_displayPages = !displayPages) => {
    console.log("Toggling display pages:", _displayPages);
    setDisplayPages(_displayPages);
  };

  const fetchBook = (): Promise<Book> => {
    console.log("fetchBook called");

    return new Promise(async (resolve, reject) => {
      try {
        const _url = await getURL();
        console.log("Got URL:", _url);

        if (!_url) {
          console.log("No URL available");
          return reject("Couldn't get URL for this book");
        }

        const url = getBookURL(_url);
        console.log("Book URL:", url);

        if (!url) {
          console.log("Could not generate book URL");
          return reject("Could not get book URL");
        }

        let book = await getBook(url);
        console.log("Got book:", book);

        if (!book) {
          console.log("No book found, creating new one");
          book = { url, pages: [] };
          const message: Messages.SaveBook = { action: "SaveBook", book };
          chrome.runtime.sendMessage(message);
        } else {
          console.log(
            "Received existing book with",
            book.pages?.length || 0,
            "pages"
          );
        }

        setBook(book);
        resolve(book);
      } catch (e) {
        console.error("Error in fetchBook:", e);
        return reject(e);
      }
    });
  };

  const download = async () => {
    console.log("Download clicked");

    if (!book?.url) {
      console.log("No book URL for download");
      return;
    }

    setProgress(0);
    setLog([]);
    setError(null);

    try {
      await createPDF(book, setProgress, addLog, setError);
      console.log("PDF created successfully");
    } catch (e: any) {
      console.error("Download error:", e);
      setError(e.message || "Unknown error");
    }
  };

  const reset = async () => {
    console.log("Reset clicked");

    if (!book?.url) {
      console.log("No book URL for reset");
      return;
    }

    const message: Messages.ClearBook = {
      action: "ClearBook",
      bookURL: book.url,
    };

    try {
      await chrome.runtime.sendMessage(message);

      setBook(undefined);
      setLog([]);
      setProgress(0);
      setError(null);

      await fetchBook();
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  const updatePageOrder = async (oldIndex: number, newIndex: number) => {
    console.log("Updating page order:", oldIndex, "->", newIndex);

    if (!book?.url) return;

    const message: Messages.UpdatePageOrder = {
      action: "UpdatePageOrder",
      bookURL: book.url,
      oldIndex,
      newIndex,
      numPages: 1,
    };

    return await chrome.runtime.sendMessage(message, fetchBook);
  };

  const deletePage = async (pageIndex: number) => {
    console.log("Deleting page at index:", pageIndex);

    if (!book?.url) return;

    // Create a new book object with the page removed
    const updatedPages = [...book.pages];
    updatedPages.splice(pageIndex, 1);

    const updatedBook = { ...book, pages: updatedPages };

    // Save the updated book
    const message: Messages.SaveBook = {
      action: "SaveBook",
      book: updatedBook,
    };

    try {
      await chrome.runtime.sendMessage(message);
      setBook(updatedBook);
    } catch (e) {
      console.error("Delete page error:", e);
    }
  };

  console.log("Rendering popup with book:", book);

  // Filter out only actual image pages for display
  const imagePages =
    book?.pages?.filter(
      (url) => url.includes("/docImage.action") && url.includes("encrypted=")
    ) || [];

  return (
    <Box
      width="450px"
      p={4}
      minHeight="400px"
      maxHeight="600px"
      bg="white"
      color="black"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      <VStack gap={4}>
        <Heading size="lg" textAlign="center" color="blue.600">
          eBook Scraper
        </Heading>

        {/* <Separator borderColor="gray.300" /> */}

        {book ? (
          <VStack gap={3} width="100%">
            <Box textAlign="center">
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                Total captures: {book.pages?.length || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Valid images: {imagePages.length}
              </Text>
            </Box>

            <HStack gap={2} width="100%">
              <Button
                onClick={download}
                colorPalette="blue"
                size="md"
                flex={1}
                disabled={imagePages.length === 0}
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                _disabled={{ bg: "gray.300", color: "gray.500" }}
              >
                Download PDF ({imagePages.length} images)
              </Button>
              <ResetButton reset={reset}>Reset</ResetButton>
            </HStack>

            <Checkbox
              checked={displayPages}
              onChange={() => toggleDisplayPages()}
            >
              Show captured pages
            </Checkbox>

            {imagePages.length > 0 && (
              <Box width="100%" mt={4}>
                <Text fontSize="sm" fontWeight="medium">
                  Progress: {progress}%
                </Text>
                <Box
                  height="8px"
                  bg="gray.200"
                  borderRadius="md"
                  overflow="hidden"
                  mt={1}
                  mb={3}
                >
                  <Box
                    height="8px"
                    width={`${progress}%`}
                    bg="blue.500"
                    transition="width 0.3s ease"
                  />
                </Box>

                {error && (
                  <Box
                    bg="red.100"
                    border="1px solid red"
                    p={2}
                    borderRadius="md"
                    mb={2}
                  >
                    <Text fontSize="sm" color="red.700">
                      {error}
                    </Text>
                  </Box>
                )}

                <Box
                  ref={logEndRef}
                  height="120px"
                  overflowY="auto"
                  p={2}
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  bg="gray.50"
                  fontSize="xs"
                  fontFamily="monospace"
                >
                  {log.map((line, idx) => (
                    <Text key={idx}>{line}</Text>
                  ))}
                </Box>
              </Box>
            )}

            {displayPages && (
              <Box width="100%">
                <Text fontSize="sm" color="gray.700" mb={2} fontWeight="medium">
                  Image Pages ({imagePages.length}):
                </Text>
                <VStack
                  gap={2}
                  maxHeight="250px"
                  overflowY="auto"
                  width="100%"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={2}
                  bg="gray.50"
                >
                  {imagePages.map((url, index) => (
                    <Page
                      key={url}
                      url={url}
                      index={index}
                      moveUp={
                        index > 0
                          ? () => updatePageOrder(index, index - 1)
                          : undefined
                      }
                      moveDown={
                        index < imagePages.length - 1
                          ? () => updatePageOrder(index, index + 1)
                          : undefined
                      }
                      deletePage={() => deletePage(index)}
                    />
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        ) : (
          <VStack gap={3} textAlign="center" py={8}>
            <Text fontSize="xl" color="gray.600">
              Navigate to a ProQuest ebook
            </Text>
            <Text fontSize="sm" color="gray.500">
              Start reading pages to begin capturing images
            </Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

export default Popup;
