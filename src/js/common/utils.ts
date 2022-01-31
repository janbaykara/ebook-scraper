import sites from "./sites";

export function getActiveTab(): Promise<false | chrome.tabs.Tab> {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs.length) return resolve(false);
      return resolve(tabs[0]);
    });
  });
}

export async function getURL(): Promise<false | URL> {
  const tab = await getActiveTab();
  return tab ? new URL(tab.url) : false;
}

export function getBookURL(url: URL): string {
  const site = sites.find(site => site.host === url.host);

  if (site) {
    return site.constructBookURL(url);
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

  const site = sites.find(site => site.testPageImageURL(request, url));

  if (site) {
    return site.getPageImageURL(url);
  }

  return Promise.resolve(null);
}

export const getBook = (url: string): Promise<Book | null> =>
  new Promise(resolve => {
    chrome.storage.local.get(url, (store?: LocalStorageData) => {
      const book = store[url];
      if (book) {
        return resolve(book);
      }
      return resolve(null);
    });
  });

export function createPDF(book: Book): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!book.pages) {
        reject("Book has no pages to construct a PDF from");
      }

      // create a document and pipe to a blob
      // let images: {
      //   [key: string]: { image: HTMLImageElement; blobURI: string };
      // } = {};

      // const fetchedImages = await Promise.all(
      //   book.pages.map(async (url, i) => {
      //     return new Promise(async (resolve, reject) => {
      //       const blobURI = await fetchAsBlob(url);
      //       var image = new Image();
      //       image.onload = () => {
      //         images[url] = { image, blobURI };
      //         if (blobURI) {
      //           resolve(true);
      //         } else {
      //           reject("Couldn't fetch image for page URL");
      //         }
      //       };
      //       image.src = blobURI;
      //     });
      //   })
      // );

      // if (!fetchedImages) {
      //   reject("Couldn't fetch images for all pages");
      // }

      // // Define the dimensions of the doc
      // const templatePage = Object.values(images)[0];
      // var doc = new jsPDF({
      //   unit: "px",
      //   format: [templatePage.image.width, templatePage.image.height]
      // });

      // const width = (doc.internal.pageSize as any).getWidth();
      // const height = (doc.internal.pageSize as any).getHeight();

      // book.pages.forEach((url, i, arr) => {
      //   const { blobURI } = images[url];
      //   doc.addImage(blobURI, 0, 0, width, height);
      //   if (arr.length > i + 1) {
      //     doc.addPage();
      //   }
      // });

      // doc.save(`book-section-${book.url}.pdf`);

      // TODO: Generate and save PDF
      console.log("Download file")

      // resolve(doc);
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
