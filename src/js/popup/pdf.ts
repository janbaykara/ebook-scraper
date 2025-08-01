import { fetchAsBlob, getActiveTab } from '../common/utils';
import { jsPDF } from 'jspdf';

export function createPDF(
  book: Book,
  onProgress?: (percent: number) => void,
  onLog?: (msg: string) => void,
  onError?: (err: string) => void
): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!book.pages || book.pages.length === 0) {
        const err = "No pages to create PDF";
        onError?.(err);
        return reject(new Error(err));
      }

      // Filter out non-image URLs
      const imagePages = book.pages.filter(
        (url) => url.includes("/docImage.action") && url.includes("encrypted=")
      );

      if (imagePages.length === 0) {
        const err = "No valid image pages found";
        onError?.(err);
        return reject(new Error(err));
      }

      const pdf = new jsPDF("p", "pt", "a4"); // portrait, points, A4 size
      let isFirstPage = true;

      const totalPages = imagePages.length;
      let processed = 0;


      for (const pageUrl of imagePages) {
        
        onLog?.(`Processing page ${processed + 1} of ${totalPages}`);
        
        try {
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
              const ratio = Math.min(
                pageWidth / imgWidth,
                pageHeight / imgHeight
              );
              const scaledWidth = imgWidth * ratio;
              const scaledHeight = imgHeight * ratio;

              // Add the image to the PDF
              pdf.addImage(img, "JPEG", 0, 0, scaledWidth, scaledHeight);
              imgLoadResolve();
            };
            img.onerror = () => {
              const err = `Failed to load image: ${pageUrl}`;
              onLog?.(err);
              onError?.(err);
              imgLoadResolve();
            };
          });
        } catch (err: any) {
          const msg = `Error processing page ${processed + 1}: ${err.message}`;

          onLog?.(msg);
          onError?.(msg);
        }

        processed++;
        const percent = Math.round((processed / totalPages) * 100);
        onProgress?.(percent);
      }

      // File name
      const activeTab = await getActiveTab();
      const title = activeTab ? activeTab.title : book.url;
      const filename = `${title}_${totalPages}pages.pdf`;

      onLog?.("PDF generation complete.");
      pdf.save(filename);
      resolve(pdf);
    } catch (e: any) {
      const err = `Fatal error: ${e.message}`;
      onError?.(err);
      reject(e);
    }
  });
}
