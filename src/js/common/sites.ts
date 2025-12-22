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
  {
    // TODO: implement the cross-browser thingy that also does hot reload, so it's not a fkin pain in the ass to develop on
    // TODO: autosave pages in the right order, since there's a way to identify the page number from the URL
    // TODO: improve the preview display of the pages in the popup
    // Reader page https://r3.vlebooks.com/Reader?ean=9781844456994
    // includes a series of images like https://r3.vlebooks.com/reader?handler=PageImage&ean=9781844456994&pagenumber=1&imageWidth=1000
    // the reader is a scrollable container with page-ID'd elements
    // and the page images are loaded when you scroll to the page
    // <div id="page12" class="pdfscrollablepage grabable" data-pg="12" style="height: 1008px; width: 704.298px;"><table class="pageLoadContainer" style="width:704px; height:1008px"><tbody><tr><td>1 What do we mean by youth work?<br>p1</td></tr></tbody></table><figure id="figsvg-12" class="figsvg"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 487 697" preserveAspectRatio="xMinYMin meet" id="svg-12"><image class="pdfpageimage" width="487" height="697" xlink:href="/reader?handler=PageImage&amp;ean=9781844456994&amp;pagenumber=12&amp;imageWidth=1000" href="/reader?handler=PageImage&amp;ean=9781844456994&amp;pagenumber=12&amp;imageWidth=1000"></image><g id="pageannotations12"><svg id="bookmark-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="40" height="100" x="467" preserveAspectRatio="none" class="pagebookmark " style="display: none;"><path d="M0 512V48C0 21.49 21.49 0 48 0h288c26.51 0 48 21.49 48 48v464L192 400 0 512z"></path></svg></g><g id="pageTextBoxes12"></g></svg></figure></div>
    name: 'VLEBooks',
    chromeURLScope: '*://r3.vlebooks.com/',
    host: 'r3.vlebooks.com',
    readerDomain: {
      urlContains: 'r3.vlebooks.com/Reader?ean=',
    },
    constructBookURL: (_url) => {
      return _url.toString();
    },
    pageResourceURLFilter: '*://*.vlebooks.com/*',
    testPageImageURL: (_, url) => {
      return (
        url.pathname.includes('/reader') &&
        url.searchParams.has('handler') &&
        url.searchParams.get('handler') === 'PageImage' &&
        url.searchParams.has('ean') &&
        url.searchParams.has('pagenumber') &&
        url.searchParams.has('imageWidth')
      );
    },
    getPageImageURL: (url) => {
      return url.toString();
    },
  },
];

export default sites;
