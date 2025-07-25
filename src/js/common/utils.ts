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
  return tab && tab.url ? new URL(tab.url) : false;
}

export function getBookURL(url: URL): string | undefined {
  const site = sites.find(site => site.host === url.host);

  if (site) {
    return site.constructBookURL(url);
  }
  return undefined;
}

/**
 * Determines whether a URL is a page image
 * @param path
 */
export function extractPageImageURL(
  request: chrome.webRequest.WebRequestBodyDetails | chrome.webRequest.WebResponseCacheDetails
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
      const book = store?.[url];
      if (book) {
        return resolve(book);
      }
      return resolve(null);
    });
  });

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
 * @param array
 * @param from Starting index
 * @param to Finishing index
 * @param on How many elements to move from 'from' (starting index)
 */
export function move<T extends any[]>(array: T, from: number, to: number, on = 1) {
  array.splice(to, 0, ...array.splice(from, on));
  return array;
}
