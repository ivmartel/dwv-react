# dwv-react

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [React](https://reactjs.org/).

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-react is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Build Status](https://travis-ci.com/ivmartel/dwv-react.svg?branch=master)](https://travis-ci.com/ivmartel/dwv-react)

## Steps to run the viewer from scratch

Get the code:
```sh
git clone https://github.com/ivmartel/dwv-react.git
```

Move to its folder:
```sh
cd dwv-react
```

Install dependencies (using `yarn`, replace with `npm` if you prefer):
```sh
yarn install
```

Call the start script to launch the viewer on a local server:
```sh
yarn run start
```

You can now open a browser at http://localhost:3000 and enjoy!

## Available Scripts

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:3000
yarn run start

# run unit tests
yarn run test

# build for production
yarn run build
```

Unit tests use [Jest](https://facebook.github.io/jest/).

This project was generated with the [Create React App](https://github.com/facebookincubator/create-react-app) version 1.1.1.

More details in the [user guide](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md).
