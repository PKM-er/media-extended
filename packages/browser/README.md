# TypeScript React Chrome Extension Boilerplate

A basic TypeScript React Chrome Extension boilerplate that gets you started quickly. It supports **TypeScript**, **JSX**, and **automatic reloading** during development. Jest, ESLint and Prettier included, all bundled using [Rollup](https://rollupjs.org/guide/en/) and [`rollup-plugin-chrome-extension`](https://extend-chrome.dev/rollup-plugin).

## Get Started

### Using `create-react-crx`

Type this into your terminal:

```sh
npx create-react-crx
```

Follow the prompts to setup your Chrome extension project.

### Using `git clone`

Type this into your terminal:

```sh
git clone https://github.com/extend-chrome/ts-react-boilerplate.git my-chrome-extension
cd my-chrome-extension
npm install
```

> 🖌️ Update your package name and version in `package.json` before you get started!

### Development

For development with automatic reloading:

```sh
npm run start
```

Open the [Extensions Dashboard](chrome://extensions), enable "Developer mode", click "Load unpacked", and choose the `dist` folder.

When you make changes in `src` the background script and any content script will reload automatically.

### Production

When it's time to publish your Chrome extension, make a production build to submit to the Chrome Web Store. This boilerplate will use the version in `package.json`, unless you add a version to `src/manifest.json`.

> Make sure you have updated the name and version of your extension in `package.json`.

Run the following line:

```sh
npm run build
```

This will create a ZIP file with your package name and version in the `releases`
folder.

## Source Layout

Your manifest is at `src/manifest.json`, and Rollup will bundle any files you
include here. All the filepaths in your manifest should point to files in `src`.

## Features

- Uses Rollup to bundle your extension
- Chrome Extension automatic reloader
- Jest configuration for testing

## Resources

[Chrome Extension official documentation](https://developer.chrome.com/docs/webstore/)

[How to Publish your extension step by step video tutorial](https://www.youtube.com/playlist?list=PLYlOQabA4Mm0bPiMKIBMgZK0u2jbYsrC6)
