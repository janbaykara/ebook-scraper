const sites = require("./js/common/sites").default;

// A loader to transform a partial manifest.json file into a complete
// manifest.json file by adding entries from an NPM package.json.
module.exports = function(manifest) {
  manifest = JSON.parse(manifest);
  /// ---

  // Add site-specific permissions to the extension
  const siteURLs = sites.map(site => site.chromeURLScope);
  const nextManifest = Object.assign({}, manifest, {
    permissions: manifest.permissions.concat(siteURLs)
  });

  /// ---
  const editedJSON = JSON.stringify(nextManifest, null, 2);

  // In Webpack, loaders ultimately produce JavaScript. In order to produce
  // another file type (like JSON), it needs to be emitted separately.
  this.emitFile("manifest.json", editedJSON);

  // Return the processed JSON to be used by the next item in the loader chain.
  return editedJSON;
};
