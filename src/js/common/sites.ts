interface SiteConfig {
  name: string;
  /**
   * Allow the chrome extension to operate
   * in this URL pattern
   */
  chromeURLScope: string;
  /**
   * Matching hostname for this module
   */
  host: string;
  /**
   * Root path to the reader app
   */
  readerDomain: chrome.declarativeContent.PageStateUrlDetails;
  /**
   * A canonical ID for a book,
   * (should point to the user-viewable resource)
   */
  constructBookURL(url: URL): string;
  /**
   * URL pattern to listen to for potential page image resources
   * via the chrome.webRequest.RequestFilter API
   */
  pageResourceURLFilter: string;
  /**
   * Validate a type of page resource
   * as a page image
   */
  testPageImageURL(
    request: chrome.webRequest.WebRequestBodyDetails, // Changed type
    url: URL
  ): boolean;
  /**
   * Return a page image URI
   * (reference or base64 string)
   */
  getPageImageURL(url: URL): Promise<string | null>; // updated to return null if not found
}

const sites: SiteConfig[] = [
  //https://www.proquest.com/docview/2837705652/bookReader?sourcetype=Books 
  {
    name: "ProQuest",
    chromeURLScope: "*://*.proquest.com/*",
    host: "www.proquest.com",
    readerDomain: { hostContains: "proquest.com" },
    constructBookURL: (url: URL) => {
      // For ProQuest, we want to extract a meaningful book identifier
      // from the current page URL, not from the image URL
      if (url.pathname.includes('/docview/')) {
        const pathMatch = url.pathname.match(/\/docview\/(\d+)/);
        if (pathMatch) {
          return `proquest.com/docview/${pathMatch[1]}`;
        }
      }

      if (url.pathname.includes('/bookReader')) {
        return url.href.replace('https://', '').replace('http://', '');
      }

      // Fallback
      return url.host + url.pathname;
    },
    pageResourceURLFilter: "*://ebookcentral.proquest.com/*/docImage.action*",
    testPageImageURL: (request, url) => {
      return url.hostname.includes('ebookcentral.proquest.com') &&
        url.pathname.includes('/docImage.action') &&
        url.searchParams.has('encrypted');
    },
    getPageImageURL: async (url: URL) => {
      // Return the image URL directly
      return url.href;
    }
  },
  {
    name: "ProQuest Ebook Central",
    chromeURLScope: "*://*.proquest.com/*",
    host: "ebookcentral.proquest.com",
    readerDomain: { hostContains: "proquest.com" },
    constructBookURL: (url: URL) => {
      // For ProQuest Ebook Central, the book URL structure is different
      if (url.pathname.includes('/docview/')) {
        const pathMatch = url.pathname.match(/\/docview\/(\d+)/);
        if (pathMatch) {
          return `proquest.com/docview/${pathMatch[1]}`;
        }
      }

      // Fallback to the default behavior
      return url.host + url.pathname;
    },
    pageResourceURLFilter: "*://ebookcentral.proquest.com/*/docImage.action*",
    testPageImageURL: (request, url) => {
      return url.hostname.includes('ebookcentral.proquest.com') &&
        url.pathname.includes('/docImage.action') &&
        url.searchParams.has('encrypted');
    },
    getPageImageURL: async (url: URL) => {
      // Return the image URL directly
      return url.href;
    }
  }
];

export default sites;
