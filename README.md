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
 - `build`: build for production

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

## DWVs' Web workers
dwv loads its web workers at runtime from `assets/workers/` relative to the page base URI.
They are not bundled automatically: the `dwvWorkers` Vite plugin (`plugins/dwvWorkers.js`) serves them
from the dwv package (`node_modules/dwv/dist/assets/workers`) in dev and copies them to
`dist/assets/workers` in the build, so they always match the installed dwv version.
An application embedding the viewer needs to serve them the same way.
