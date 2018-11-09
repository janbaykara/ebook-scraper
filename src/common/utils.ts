import * as jsPDF from "jspdf";

export function getURL(): Promise<URL | undefined> {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        if (!tabs.length) return null;
        const url = tabs[0].url;
        return resolve(new URL(url));
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function getBookURL(url: URL): string {
  if (url.host === "ebookcentral.proquest.com") {
    return `${url.host}${url.pathname}?docID=${url.searchParams.get("docID")}`;
  }

  if (url.host === "www.dawsonera.com") {
    return `${url.host}${url.pathname}`;
  }

  if (url.host === "www.jstor.org") {
    // e.g. https://www.jstor.org/stable/41857568?read-now=1&seq=1#metadata_info_tab_contents
    return `${url.host}${url.pathname}`;
  }
}

/**
 * Determines whether a URL is a page image
 * @param path
 */
export function extractPageImageURL(
  request: chrome.webRequest.WebResponseCacheDetails
): Promise<string | null> {
  const url = new URL(request.url);

  if (request.type === "image" && url.host === "ebookcentral.proquest.com") {
    return Promise.resolve(
      url.pathname.includes("docImage.action") ? url.toString() : null
    );
  }

  if (request.type === "image" && url.host === "www.dawsonera.com") {
    return Promise.resolve(
      url.pathname.includes("reader") && url.pathname.includes("/page/")
        ? url.toString()
        : null
    );
  }

  if (request.type === "xmlhttprequest" && url.host === "www.jstor.org") {
    // e.g. https://www.jstor.org/stable/get_image/41857568?path=czM6Ly9zZXF1b2lhLWNlZGFyL2NpZC1wcm9kLTEvNDhiMDU4ZTYvMWY4MC8zY2NlLzlmNzEvZjcxMGNiMWQ2MWYyL2k0MDA4Nzg0MC80MTg1NzU2OC9pbWFnZXMvcGFnZXMvZHRjLjExLnRpZi5naWY
    if (url.pathname.includes("get_image") && url.searchParams.has("path")) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await fetch(url.toString());
          return resolve(await res.text());
        } catch (e) {
          reject(e);
        }
      });
    }
  }

  return Promise.resolve(null);
}

export const getBook = (url: string): Promise<Book | null> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.get(url, (store?: LocalStorageData) => {
      const book = store[url];
      if (book) {
        return resolve(book);
      }
      return resolve(null);
    });
  });

export function createPDF(book: Book): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!book.pages) {
        reject("Book has no pages to construct a PDF from");
      }

      // create a document and pipe to a blob
      let images: {
        [key: string]: { image: HTMLImageElement; blobURI: string };
      } = {};

      const fetchedImages = await Promise.all(
        book.pages.map(async (url, i) => {
          return new Promise(async (resolve, reject) => {
            const blobURI = await fetchAsBlob(url);
            var image = new Image();
            image.onload = () => {
              images[url] = { image, blobURI };
              if (blobURI) {
                resolve(true);
              } else {
                reject("Couldn't fetch image for page URL");
              }
            };
            image.src = blobURI;
          });
        })
      );

      if (!fetchedImages) {
        reject("Couldn't fetch images for all pages");
      }

      // Define the dimensions of the doc
      const templatePage = Object.values(images)[0];
      var doc = new jsPDF({
        unit: "px",
        format: [templatePage.image.width, templatePage.image.height]
      });

      const width = (doc.internal.pageSize as any).getWidth();
      const height = (doc.internal.pageSize as any).getHeight();

      book.pages.forEach((url, i, arr) => {
        const { blobURI } = images[url];
        doc.addImage(blobURI, 0, 0, width, height);
        if (arr.length > i + 1) {
          doc.addPage();
        }
      });

      doc.save(`book-section-${book.url}.pdf`);
      resolve(doc);
    } catch (e) {
      return reject(e);
    }
  });
}

export function fetchAsBlob(path: string): Promise<string> {
  return new Promise(resolve => {
    fetch(path)
      .then(res => res.blob())
      .then(blob => {
        var a = new FileReader();
        a.onload = e => {
          resolve((e.target as any).result as string);
        };
        a.readAsDataURL(blob);
      });
  });
}

/**
 *
 * @param array
 * @param from Starting index
 * @param to Finishing index
 * @param on How many elements to move from 'from' (starting index)
 */
export function move<T extends any[]>(array: T, from, to, on = 1) {
  array.splice(to, 0, ...array.splice(from, on));
  return array;
}
