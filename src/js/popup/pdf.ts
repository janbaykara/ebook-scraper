import { fetchAsBlob, getActiveTab } from '../common/utils';
import { jsPDF } from 'jspdf';
import { sha1 } from 'object-hash'

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

      let bookHash = sha1(book)
      const activeTab = await getActiveTab()
      const title = `${activeTab ? activeTab.title : book.url} (${book.pages.length} pages) (${bookHash}).pdf`
      doc.save(title);

      resolve(doc);
    } catch (e) {
      return reject(e);
    }
  });
}