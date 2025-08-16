type SiteConfig = {
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
    request: chrome.webRequest.WebRequestBodyDetails | chrome.webRequest.WebResponseCacheDetails,
    url: URL,
  ): boolean;
  /**
   * Return a page image URI
   * (reference or base64 string)
   */
  getPageImageURL(url: URL): string | null;
};

const sites: SiteConfig[] = [
  //https://www.proquest.com/docview/2837705652/bookReader?sourcetype=Books
  {
    name: 'ProQuest',
    chromeURLScope: '*://*.proquest.com/*',
    host: 'www.proquest.com',
    readerDomain: { hostContains: 'proquest.com' },
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
    pageResourceURLFilter: '*://ebookcentral.proquest.com/*/docImage.action*',
    testPageImageURL: (_request, url) => {
      return (
        url.hostname.includes('ebookcentral.proquest.com') &&
        url.pathname.includes('/docImage.action') &&
        url.searchParams.has('encrypted')
      );
    },
    getPageImageURL: (url: URL) => {
      // Return the image URL directly
      return url.href;
    },
  },
  {
    name: 'ProQuest Ebook Central (Binghamton Proxy)',
    chromeURLScope: '*://ebookcentral-proquest-com.proxy.binghamton.edu/*',
    host: 'ebookcentral-proquest-com.proxy.binghamton.edu',
    readerDomain: { hostContains: 'ebookcentral-proquest-com.proxy.binghamton.edu' },
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
    pageResourceURLFilter: '*://ebookcentral-proquest-com.proxy.binghamton.edu/*/docImage.action*',
    testPageImageURL: (_request, url) => {
      return (
        url.hostname === 'ebookcentral-proquest-com.proxy.binghamton.edu' &&
        url.pathname.includes('/docImage.action') &&
        url.searchParams.has('encrypted')
      );
    },
    getPageImageURL: (url: URL) => {
      // Return the image URL directly
      return url.href;
    },
  },
  {
    name: 'ProQuest Ebook Central',
    chromeURLScope: '*://*.proquest.com/*',
    host: 'ebookcentral.proquest.com',
    readerDomain: { hostContains: 'proquest.com' },
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
    pageResourceURLFilter: '*://ebookcentral.proquest.com/*/docImage.action*',
    testPageImageURL: (_request, url) => {
      return (
        url.hostname.includes('ebookcentral.proquest.com') &&
        url.pathname.includes('/docImage.action') &&
        url.searchParams.has('encrypted')
      );
    },
    getPageImageURL: (url: URL) => {
      // Return the image URL directly
      return url.href;
    },
  },
  {
    name: 'JStor',
    chromeURLScope: '*://www.jstor.org/',
    host: 'www.jstor.org',
    readerDomain: {
      urlContains: 'jstor.org/stable/',
    },
    pageResourceURLFilter: '*://*.jstor.org/*',
    // e.g. https://www.jstor.org/stable/41857568?read-now=1&seq=1#metadata_info_tab_contents
    constructBookURL: (url) => `${url.host}${url.pathname}`,
    testPageImageURL: (request, url) =>
      ['image', 'xmlhttprequest'].includes(request.type) &&
      url.host === 'www.jstor.org' && // e.g. https://www.jstor.org/stable/get_image/41857568?path=czM6Ly9zZXF1b2lhLWNlZGFyL2NpZC1wcm9kLTEvNDhiMDU4ZTYvMWY4MC8zY2NlLzlmNzEvZjcxMGNiMWQ2MWYyL2k0MDA4Nzg0MC80MTg1NzU2OC9pbWFnZXMvcGFnZXMvZHRjLjExLnRpZi5naWY
      ((url.pathname.includes('get_image') && url.searchParams.has('path')) ||
        // e.g. https://www.jstor.org/page-scan-delivery/get-page-scan/41857568/2"
        url.pathname.includes('page-scan')),
    getPageImageURL: (url) => url.toString(),
  },
];

export default sites;
