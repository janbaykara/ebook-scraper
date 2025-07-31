import { fetchAsBlob, getActiveTab } from '../common/utils';
import { jsPDF } from 'jspdf';

export function createPDF(book: Book): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!book.pages || book.pages.length === 0) {
        reject(new Error("No pages to create PDF"));
        return;
      }

      // Filter out non-image URLs
      const imagePages = book.pages.filter(url =>
        url.includes('/docImage.action') && url.includes('encrypted=')
      );

      if (imagePages.length === 0) {
        reject(new Error("No valid image pages found"));
        return;
      }

      const pdf = new jsPDF('p', 'pt', 'a4'); // portrait, points, A4 size
      let isFirstPage = true;

      for (const pageUrl of imagePages) {
        const blobURI = await fetchAsBlob(pageUrl);
        const img = new Image();
        img.src = blobURI;

        await new Promise<void>((imgLoadResolve) => {
          img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;

            if (!isFirstPage) {
              pdf.addPage();
            } else {
              isFirstPage = false;
            }

            // Calculate dimensions to fit the page
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;

            // Add the image to the PDF
            pdf.addImage(img, 'JPEG', 0, 0, scaledWidth, scaledHeight);
            imgLoadResolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${pageUrl}`);
            imgLoadResolve();
          };
        });
      }

      // File name
      const pageCount = imagePages.length;
      const activeTab = await getActiveTab();
      const title = activeTab ? activeTab.title : book.url;
      const filename = `${title}_${pageCount}pages.pdf`;

      pdf.save(filename);
      resolve(pdf);
    } catch (e) {
      reject(e);
    }
  });
}