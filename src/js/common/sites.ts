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
  readerDomain: string;
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
    request: chrome.webRequest.WebResponseCacheDetails,
    url: URL
  ): boolean;
  /**
   * Return a page image URI
   * (reference or base64 string)
   */
  getPageImageURL(url: URL): Promise<string>;
}

const sites: SiteConfig[] = [
  {
    name: "ProQuest Ebook Central",
    chromeURLScope: "*://*.proquest.com/",
    host: "ebookcentral.proquest.com",
    readerDomain: "ebookcentral.proquest.com/lib",
    pageResourceURLFilter: "*://*.proquest.com/*",
    constructBookURL: url =>
      `${url.host}${url.pathname}?docID=${url.searchParams.get("docID")}`,
    testPageImageURL: (request, url) =>
      request.type === "image" && url.host === "ebookcentral.proquest.com",
    getPageImageURL: url =>
      Promise.resolve(
        url.pathname.includes("docImage.action") ? url.toString() : null
      )
  },
  {
    name: "Dawsonera",
    chromeURLScope: "*://*.dawsonera.com/",
    host: "www.dawsonera.com",
    readerDomain: "dawsonera.com/readonline",
    pageResourceURLFilter: "*://*.dawsonera.com/*",
    constructBookURL: url => `${url.host}${url.pathname}`,
    testPageImageURL: (request, url) =>
      request.type === "image" && url.host === "www.dawsonera.com",
    getPageImageURL: url =>
      Promise.resolve(
        url.pathname.includes("reader") && url.pathname.includes("/page/")
          ? url.toString()
          : null
      )
  },
  {
    name: "JStor",
    chromeURLScope: "*://www.jstor.org/",
    host: "www.jstor.org",
    readerDomain: "jstor.org/stable/",
    pageResourceURLFilter: "*://*.jstor.org/*",
    // e.g. https://www.jstor.org/stable/41857568?read-now=1&seq=1#metadata_info_tab_contents
    constructBookURL: url => `${url.host}${url.pathname}`,
    testPageImageURL: (request, url) =>
      ["image", "xmlhttprequest"].includes(request.type) &&
      url.host === "www.jstor.org" && (
        (
          // e.g. https://www.jstor.org/stable/get_image/41857568?path=czM6Ly9zZXF1b2lhLWNlZGFyL2NpZC1wcm9kLTEvNDhiMDU4ZTYvMWY4MC8zY2NlLzlmNzEvZjcxMGNiMWQ2MWYyL2k0MDA4Nzg0MC80MTg1NzU2OC9pbWFnZXMvcGFnZXMvZHRjLjExLnRpZi5naWY
          url.pathname.includes("get_image") &&
          url.searchParams.has("path")
        ) || (
          // e.g. https://www.jstor.org/page-scan-delivery/get-page-scan/41857568/2"
          url.pathname.includes('page-scan')
        )
      ),
    getPageImageURL: url => Promise.resolve(url.toString())
  }
];

export default sites;
