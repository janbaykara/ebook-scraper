import { jsPDF } from 'jspdf';

import type { Book } from './types';
import { fetchAsBlob, getActiveTab } from './utils';

export async function createPDF(
  book: Book,
  onProgress?: (percent: number) => void,
  onLog?: (msg: string) => void,
  onError?: (err: string) => void,
): Promise<jsPDF> {
  try {
    if (!book.pages || book.pages.length === 0) {
      const err = 'No pages to create PDF';
      onError?.(err);
      throw new Error(err);
    }

    // Filter out non-image URLs
    const imagePages = book.pages.filter((url) => url.includes('/docImage.action') && url.includes('encrypted='));

    if (imagePages.length === 0) {
      const errorMessage = 'No valid image pages found';
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    const pdf = new jsPDF('p', 'pt', 'a4'); // portrait, points, A4 size
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
          let lastBlobUrl: string | null = null;

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

            //Free blobs after images are added to prevent memory overload
            //Queue last cycle's blob otherwise errors are thrown
            if (lastBlobUrl) {
              URL.revokeObjectURL(lastBlobUrl);
            }
            lastBlobUrl = img.src;

            imgLoadResolve();
          };
          img.onerror = () => {
            const err = `Failed to load image: ${pageUrl}`;
            onLog?.(err);
            onError?.(err);
            imgLoadResolve();
          };
        });
      } catch (err: unknown) {
        const errorMessage = `Error processing page ${processed + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`;

        onLog?.(errorMessage);
        onError?.(errorMessage);
      }

      processed++;
      const percent = Math.round((processed / totalPages) * 100);
      onProgress?.(percent);
    }

    // File name
    const activeTab = await getActiveTab();
    const title = activeTab ? activeTab.title : book.url;
    const filename = `${title}_${totalPages}pages.pdf`;

    onLog?.('PDF generation complete.');
    onLog?.('Starting PDF download.');
    pdf.save(filename);
    onLog?.('PDF download complete.');
    return pdf;
  } catch (e: unknown) {
    const message = `Fatal error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    onError?.(message);
    throw e;
  }
}
