# dwv-react

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [React](https://reactjs.org/).

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-react is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Node.js CI](https://github.com/ivmartel/dwv-react/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/ivmartel/dwv-react/actions/workflows/nodejs-ci.yml)

## Available Scripts

 - `install`: install dependencies
 - `dev`: serve with hot reload at localhost:5173
 - `lint`: lint the code with [ESLint](https://eslint.org/)
 - `test`: run unit tests (watch mode)
 - `test-ci`: run unit tests once with coverage
 - `build`: build the demo for production
 - `build-lib`: build the library (to `dist/dwv-react-lib/`)

Unit tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

This project uses [Vite](https://vite.dev/) and [Yarn](https://yarnpkg.com/) (enable it with `corepack enable`).

## Steps to run the viewer from scratch

```sh
# get the code
git clone https://github.com/ivmartel/dwv-react.git

# move to its folder
cd dwv-react

# install dependencies
yarn install

# call the dev script to launch the viewer on a local server
yarn run dev
```

You can now open a browser at http://localhost:5173 and enjoy!

## Use as a library

```sh
yarn add dwv-react react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled
```

```jsx
import { DwvViewer } from 'dwv-react';
import 'dwv-react/style.css';

// the viewer fills its container: give it a height
<div style={{height: '100vh'}}>
  <DwvViewer uri="https://www.demo.com/index.html?input=file.dcm" />
</div>
```

Properties: `uri`, `urls` (white space separated), `loadFromWindowLocation` and `showLegend`.
Each viewer creates its own state: several viewers can be used on the same page.
The viewer uses the MUI theme of the application if there is one
(the side panel uses an optional `background.surfaceContainer` palette token).

With Vite, add the workers plugin (see below) to the application config:

```js
import { dwvWorkers } from 'dwv-react/vite-plugin';

export default defineConfig({ plugins: [react(), dwvWorkers()] });
```

The package is released under GPL-3.0, as dwv.

## DWVs' Web workers
dwv loads its web workers at runtime from `assets/workers/` relative to the page base URI.
They are not bundled automatically: the `dwvWorkers` Vite plugin (`plugins/dwvWorkers.js`) serves them
from the dwv package (`node_modules/dwv/dist/assets/workers`) in dev and copies them to
`dist/dwv-react-app/assets/workers` in the build, so they always match the installed dwv version.
An application embedding the viewer needs to serve them the same way: with Vite, use the
plugin (`dwv-react/vite-plugin`), otherwise copy `node_modules/dwv/dist/assets/workers` to
`assets/workers/` next to the page. Since the path is relative to the page base URI, a page
at a nested route (for ex. `/app/viewer/123`) needs a `<base href>` pointing to where the
workers are served.
