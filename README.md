# eBook Scraper

A Chrome extension to help you create PDFs from ebooks hosted on supported academic platforms. It currently supports:

- JStor
- Ebook Central by ProQuest

<a href="https://chromewebstore.google.com/detail/ebook-scraper/bhoifjhgahfmjkonopmmfifdfjacjeak?authuser=1&hl=en-GB">
<img src="https://developer.chrome.com/static/docs/webstore/branding/image/UV4C4ybeBTsZt43U4xis.png?_gl=1*7fpowy*_up*MQ..*_ga*MTQ4Njk1MDczNy4xNzU1MjEyNTc0*_ga_H1Y3PXZW9Q*czE3NTUyMTI1NzMkbzEkZzAkdDE3NTUyMTI1NzMkajYwJGwwJGgw" title="Available in the Chrome Web Store" />
</a>

![Screenshot](screenshot.png)

### Usage

1. Navigate to a supported ebook platform (ProQuest, JStor)
2. Open an ebook you want to scrape
3. Click through each page as they load to capture images
4. Click the eBook Scraper extension icon in your toolbar
5. Use the popup interface to save pages and compile your PDF

![Screenshot](screenshot2.png)

## Developer instructions
![Build Status](https://github.com/janbaykara/ebook-scraper/actions/workflows/build.yml/badge.svg)

### Prerequisites

- Install [Node.js](https://nodejs.org/). Recommend installing with [FNM](https://github.com/Schniz/fnm)

### Prepare the local environment

1. **Clone the repository**
   ```bash
   git clone git@github.com:janbaykara/ebook-scraper.git
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

### Load the extension in Chrome

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

## Development

### Available Scripts

- `npm run dev` - Start development mode with hot-reload
- `npm run build` - Build the extension for production
- `npm run preview` - Serve the compiled production build locally from dist

### Troubleshooting

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
│   │   │   ├── sites.ts        # Site configurations
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
│   ├── manifest/
|       ├── plugin.ts           # Vite plugin for injesting manifest site permissions
|       └── template.json       # Extension manifest template
├── package.json                # Dependencies and scripts
├── tsconfig.json               # Base TypeScript configuration
├── tsconfig.app.json           # App TypeScript configuration
├── tsconfig.vite.json          # Vite bundler TypeScript configuration
└── vite.config.ts              # Vite configuration
```

## Contributing

This project welcomes contributions!

Please see the [discussions page](https://github.com/janbaykara/ebook-scraper/discussions/12) if you'd like to help maintain this repository.
