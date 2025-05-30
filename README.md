# eBook Scraper

A Chrome extension that compiles PDFs while reading ebooks from supported academic platforms.

### [**Can you help maintain this repository? Let us know! 🌈🛠💬**](https://github.com/janbaykara/ebook-scraper/discussions/12)

![Screenshot](https://i.imgur.com/3zeuWBe.png)

## Features

- Compile PDFs while reading ebooks
- Support for multiple academic platforms
- Built atop this solid [Chrome extension foundation](https://github.com/martellaj/chrome-extension-react-typescript-boilerplate)

## Supported source sites

- Dawsonera
- ProQuest
- JStor

## Installation & Setup

### Prerequisites

- Node.js (version 16+ recommended)
- npm or yarn package manager
- Google Chrome browser

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ebook-scraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   
   Or for development with hot-reload:
   ```bash
   npm run watch
   ```

### Loading the Extension in Chrome

1. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or go to Chrome menu → More tools → Extensions

2. **Enable Developer mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the extension**
   - Click "Load unpacked" button
   - **Important:** Navigate to and select the **`dist/` directory** (the build output folder), not the root or `src/` folder
   - The extension should now appear in your extensions list

4. **Verify installation**
   - You should see "eBook Scraper" in your extensions list
   - The extension icon should appear in your Chrome toolbar
   - Check that the extension shows as "Active"

### Usage

1. Navigate to a supported ebook platform (Dawsonera, ProQuest, or JStor)
2. Open an ebook you want to scrape
3. Click the eBook Scraper extension icon in your toolbar
4. Use the popup interface to save pages and compile your PDF

## Development

### Available Scripts

- `npm run watch` - Start development mode with hot-reload
- `npm run build` - Build the extension for production

### Troubleshooting

**Node.js compatibility issues:**
If you encounter `error:0308010C:digital envelope routines::unsupported`, you're using Node.js 17+ with older dependencies. The build scripts are configured to handle this automatically using the legacy OpenSSL provider.

**Extension not loading:**
- Make sure you're selecting the `dist/` directory (build output), not the root or `src/` folder
- Ensure you've run `npm run build` or `npm run watch` first
- Check that `manifest.json` exists in the `dist/` directory after building

**Build errors:**
- Try deleting `node_modules/` and running `npm install` again
- Ensure you're using Node.js version 16 or higher

### Project Structure

```
ebook-scraper/
├── src/                        # Source code
│   ├── js/                     # TypeScript/JavaScript files
│   │   ├── common/             # Shared utilities
│   │   │   ├── sites.ts        # Site configurations for ProQuest, JStor, Dawsonera
│   │   │   └── utils.ts        # Helper functions
│   │   ├── eventPage/          # Background script
│   │   │   ├── actions.ts      # Extension actions (save, delete, etc.)
│   │   │   └── index.ts        # Background script entry point
│   │   ├── popup/              # Extension popup interface
│   │   │   ├── Components.tsx  # React components
│   │   │   ├── Popup.tsx       # Main popup component
│   │   │   ├── index.tsx       # Popup entry point
│   │   │   └── pdf.ts          # PDF generation logic
│   │   └── types/              # TypeScript definitions
│   │       └── declarations.d.ts
│   ├── manifest.json           # Extension manifest template
│   ├── manifest-loader.js      # Webpack loader for manifest
│   └── tsconfig.json           # TypeScript configuration
├── dist/                       # Built extension files (webpack output)
│   ├── js/                     # Compiled JavaScript
│   │   ├── eventPage.js        # Background script
│   │   └── popup.js            # Popup interface
│   ├── manifest.json           # Final manifest with site permissions
│   ├── popup.html              # Popup HTML file
│   ├── variableDarkModeRoot.css # Dark mode styles
│   ├── 0.js, 1.js, 2.js       # Code-split chunks
│   └── manifest.js             # Manifest webpack bundle
├── package.json                # Dependencies and scripts
└── webpack.config.js           # Webpack configuration
```

## Contributing

This project welcomes contributions! Please see the [discussions page](https://github.com/janbaykara/ebook-scraper/discussions/12) if you'd like to help maintain this repository.
