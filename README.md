# dwv-react

Medical viewer using [DWV](https://github.com/ivmartel/dwv) (DICOM Web Viewer) and [React](https://reactjs.org/).

All coding/implementation contributions and comments are welcome. Releases should be ready for deployment otherwise download the code and install dependencies with a `yarn` or `npm` `install`.

dwv-react is not certified for diagnostic use. Released under GNU GPL-3.0 license (see [license.txt](license.txt)).

[![Node.js CI](https://github.com/ivmartel/dwv-react/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/ivmartel/dwv-react/actions/workflows/nodejs-ci.yml)

## Available Scripts

 - `install`: install dependencies
 - `start`: serve with hot reload at localhost:3000
 - `test`: run unit tests
 - `build`: build for production

Unit tests use [Jest](https://facebook.github.io/jest/).

This project was generated with the [Create React App](https://github.com/facebookincubator/create-react-app) version 1.1.1.

More details in the [user guide](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md).

## Steps to run the viewer from scratch

```sh
# get the code
git clone https://github.com/ivmartel/dwv-react.git

# move to its folder
cd dwv-react

# install dependencies
yarn install

# call the start script to launch the viewer on a local server
yarn run start
```

You can now open a browser at http://localhost:3000 and enjoy!
