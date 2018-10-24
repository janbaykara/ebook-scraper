export function getURL(): Promise<URL | undefined> {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        const url = tabs[0].url;

        return resolve(new URL(url));
      });
    } catch (e) {
      reject();
    }
  });
}

export function getBookURL (url: URL): string {
    if (url.host === "ebookcentral.proquest.com") {
      return `${url.host}${url.pathname}?docID=${url.searchParams.get('docID')}`;
    }

    if (url.host === "www.dawsonera.com") {
      return `${url.host}${url.pathname}`
    }
}

/**
 * Determines whether a URL is a page image
 * @param path 
 */
export function isPageUrl (url: URL): boolean {
    if (url.host === 'ebookcentral.proquest.com') {
        return url.pathname.includes('docImage.action')
    }

    if (url.host === 'www.dawsonera.com') {
        return url.pathname.includes('reader') && url.pathname.includes('/page/')
    }

    return false
}
