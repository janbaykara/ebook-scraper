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
      reject();
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
}

/**
 * Determines whether a URL is a page image
 * @param path
 */
export function isPageUrl(url: URL): boolean {
  if (url.host === "ebookcentral.proquest.com") {
    return url.pathname.includes("docImage.action");
  }

  if (url.host === "www.dawsonera.com") {
    return url.pathname.includes("reader") && url.pathname.includes("/page/");
  }

  return false;
}

export function createPDF(book: Book): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      // create a document and pipe to a blob
      let images: {
        [key: string]: { image: HTMLImageElement, blobURI: string };
      } = {};

      const fetchedImages = await Promise.all(
        book.pages.map(async (url, i) => {
          return new Promise(async (resolve, reject) => {
            const blobURI = await fetchAsBlob(url);
            var image = new Image();
            image.onload = () => {
              images[url] = { image, blobURI };
              if (blobURI) {
                resolve(true)
              } else {
                reject(false)
              }
            };
            image.src = blobURI;
          })
        })
      );

      // Define the dimensions of the doc
      const templatePage = Object.values(images)[0];
      var doc = new jsPDF({
        unit: "px",
        format: [templatePage.image.width, templatePage.image.height]
      });

      const width = (doc.internal.pageSize as any).getWidth()
      const height = (doc.internal.pageSize as any).getHeight()

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
      return reject();
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
