# AGENTS.md

Guidance for AI coding agents working on this repository.

## Project overview

Medical (DICOM) image viewer component built on
[DWV](https://github.com/ivmartel/dwv), React 19 and MUI, bundled with Vite.
Shipped with a demo application (`demo/`).
Not certified for diagnostic use. License: GPL-3.0.

The main deliverable is the npm package `@ivmartel/dwv-react`
providing the `DwvViewer` component (see [Library package](#library-package));
the repository also contains a demo app that uses it, deployed to GitHub
Pages. The library only exposes what consumers need.

## Requirements

- Viewer inputs:
  - `uri` (string, watched): URI with search arguments describing the data
    to load (for ex. `https://www.demo.com/index.html?input=file.dcm`, see
    the dwv `App.loadFromUri` method),
  - `urls` (string, watched): white space separated urls of the data to load,
  - `loadFromWindowLocation` (boolean, default false): use the window
    location as input URI if it has search arguments,
  - `showLegend` (boolean, default false): show the footer legend
    ("Powered by" dwv and React, with their versions).

  The data inputs are checked in order `uri`, `urls`, then
  `loadFromWindowLocation`; the first one that is set is used. `uri` and
  `urls` are watched: when one of these props changes to a new value, it is
  loaded on top of the existing data (`loadFromWindowLocation` is only read
  on first render).
- Toolbar: load progress, the dwv tools (scroll, zoom and pan, window level
  with presets, draw with shapes), reset, orientation toggle and
  DICOM tags dialog. Tools are disabled until data is loaded and when they
  cannot run on it (for ex. window level on colour images).
- Image window: renders the loaded data with dwv and its overlays; data is
  loaded from the viewer inputs, or by drag and drop or file selection
  (local files) through a drop box shown while no data is loaded. It refits
  when its size changes (window resize, right panel opened, closed or
  resized).
- Annotation list: in the right panel, lists the annotation groups and their
  annotations and lets the user navigate to, inspect and edit them, and save
  a group as DICOM SR. It only displays the annotation state, every action
  goes through the annotation service.
- Several viewers must work on the same page:
  - each viewer owns its own dwv app and state, no global singletons for
    viewer state,
  - HTML element ids are built from a unique viewer id
    (e.g. `<viewerId>-layerGroup`),
  - DOM queries are done within the viewer root element
    rather than `document`,
  - dialogs are attached to their viewer context.

## Design specs

Component behaviour and style are described in framework-agnostic design
specs (`doc/design/`: purpose, placement, data, structure, actions,
accessibility). Read the spec before changing a component and update it in
the same change; add one for any significant new component. The viewer is
modelled on [dwv-simplistic](https://github.com/ivmartel/dwv-simplistic);
some modules are ports of it (see the notes at the top of files and the
specs): keep their behaviour aligned unless the spec says otherwise, and
look there for reference behaviour when adding features.

## Architecture

- **Services hold the logic, components display state.** Each viewer
  (`DwvViewer`) wraps its content in its own `DwvAppServiceProvider` and
  `AnnotationServiceProvider` (see `DwvViewer.jsx`): they create one
  `DwvAppService` and one `AnnotationService` per viewer and share them
  through React contexts. Child components get them with the
  `useDwvAppService()` / `useAnnotationService()` hooks (and the annotation
  state with `useAnnotationState()`). Do not create services in child
  components and do not call the dwv `App` directly from components.
  Services keep their state private and expose it read only: components
  never mutate it (for ex. the plain data annotation state of
  `AnnotationService`), every change goes through a service method.
- Services extend `EventTarget` and notify changes with `CustomEvent`s
  (`DwvAppService` re-dispatches the dwv app events and adds its own);
  components subscribe in a `useEffect` and unsubscribe in its cleanup.
- `DwvAppServiceProvider` creates the viewer id with React's `useId()` and
  passes it to the `DwvAppService` constructor (the dwv app needs its layer
  group id at init). The service owns it (`getViewerId()`) and builds the
  element ids (`getElementId(name)` returns `<viewerId>-<name>`, for ex the
  main layer group `<viewerId>-layerGroup`); components get them with the
  `useElementId()` hook, without a fallback: components are always rendered
  inside a viewer. Element ids are never hard-coded. Only add an id when
  something references it (`getElementById`, `<label for>`,
  `aria-controls`, dwv's layer group...). In tests, provide a fake
  `DwvAppServiceContext` value with `getElementId` (see
  `RightPanel.test.jsx`).

## Library package

- Public API: the exports of `src/index.js`, currently `DwvViewer` only.
  Keep it minimal, everything exported has to be kept stable. Consumers
  render `<DwvViewer />` without any setup: the viewer creates its own
  services.
- Build: `yarn build-lib` (`vite.lib.config.js`, Vite library mode, ES
  module only) outputs `dist/dwv-react-lib/index.js` and `style.css` (the
  co-located component CSS, imported by consumers as
  `@ivmartel/dwv-react/style.css`). `yarn pack` runs it (`prepack`).
- Dependencies: React, React DOM, MUI and Emotion are peer dependencies
  (major version ranges; also dev dependencies for the demo and tests).
  `dwv` is a regular dependency pinned to an exact version. All of them
  stay external in the build: a new runtime import must be added to the
  build externals and to the peer or regular dependencies.
- `package.json` `exports`: `.` (the entry), `./style.css` and
  `./vite-plugin` (`plugins/dwvWorkers.js`, shipped as source: it is Node
  code, never import it from `src/`). `files` entries under `dist/` are
  globs (`dist/dwv-react-lib/**`): Yarn applies `.gitignore` when packing
  and `/dist` is ignored, a plain folder entry would drop files.
- Web workers: dwv loads them at runtime from `assets/workers/` relative
  to the page base URI. The `dwvWorkers` Vite plugin serves them from
  `node_modules/dwv/dist/assets/workers` in dev and copies them to the
  build, for the demo and for consumers; do not vendor them.
- Consumers provide (see the README): a container with a height, the
  stylesheet import and the workers; an MUI theme is optional (the
  `background.surfaceContainer` token has a fallback).
- Check a packaging change end to end: `yarn pack`, install the tarball
  in a scratch Vite app and build it.

## Commands

Package manager is Yarn 4 (via Corepack). Node 24 is used in CI.

- `yarn install` - install dependencies (CI uses `--immutable`)
- `yarn dev` - dev server with hot reload (Vite, http://localhost:5173)
- `yarn lint` - ESLint
- `yarn test` - Vitest in watch mode; `yarn test run` for a single run
- `yarn test-ci` - single run with coverage (as in CI)
- `yarn build` - production build of the demo to `dist/dwv-react-app/`
- `yarn build-lib` - library build to `dist/dwv-react-lib/`

Before considering a change done, follow the `verify` skill
(`.agents/skills/verify/SKILL.md`): tests, lint and a review against
the conventions below. CI
(`.github/workflows/nodejs-ci.yml`) runs lint, tests and build on every
push and PR.

## Layout

- `demo/` - the demo application (Vite root, see `vite.config.js`):
  `index.html`, `main.jsx` entry point and `App.jsx` with the MUI theme
  (light/dark from `prefers-color-scheme`, custom
  `background.surfaceContainer` token for side panels) and `public/` for
  its static files (`favicon.ico`, icons). It uses the viewer from `src/`
  and is not part of it.
- `src/` - the viewer: only code needed to embed `DwvViewer`.
- `src/index.js` - library entry point (see
  [Library package](#library-package)).
- `src/services/` - framework-independent logic wrapping dwv:
  - `DwvAppService.js` - owns the dwv `App`; extends `EventTarget` and
    re-dispatches selected dwv events as `CustomEvent`s.
  - `AnnotationService.js` - annotation state.
  - `*Provider.jsx` - React contexts exposing the services
    (`useDwvAppService`, `useAnnotationService`, `useAnnotationState`).
  - `overlays.js`, `quantification.js` - helpers.
- `src/components/` - React function components (`DwvViewer`,
  `AnnotationList`, `RightPanel`, `TagsTable`, header/footer...),
  each with a co-located `.css` file when needed.
- `plugins/` - Vite plugins (`dwvWorkers.js`, see
  [Library package](#library-package)).
- `vite.config.js` - demo build; `vite.lib.config.js` - library build.
- `tests/setup.js` - Vitest setup (jest-dom matchers, cleanup).

## Conventions

- Plain JavaScript (ES modules), `.jsx` for files containing JSX. No
  TypeScript; document with JSDoc (`@param`, `@returns`, `@type`,
  `@typedef`) as in the existing code.
- Function components and hooks only. `react-hooks/exhaustive-deps` is an
  error. The app runs in `StrictMode`, so effects must be idempotent and
  clean up after themselves (see `DwvAppServiceProvider.jsx`: the service
  is created once with `useState(() => ...)`, connected/disconnected in an
  effect).
- Keep dwv-specific logic in `src/services/`; components consume services
  through the provider hooks and render state. When a file is a port of a
  dwv-simplistic module, keep the header comment that says so and stay
  close to it.
- UI uses MUI components and `@mui/icons-material`; use theme tokens
  rather than hard-coded colours.
- Keep custom styling to a minimum and follow the
  [Material Design](https://m3.material.io/) guidelines: prefer MUI
  component props and the theme over custom CSS or `sx` overrides.
- Style: 2-space indent, single quotes, semicolons, private class fields
  (`#field`) for service internals. Unused args must be prefixed with `_`.
- Do not patch dwv (no edits in `node_modules/dwv`, no `patch-package` or
  Yarn patches, no monkey-patching at runtime). If a fix or feature is
  needed in dwv itself, propose a pull request to the
  [dwv repository](https://github.com/ivmartel/dwv) instead.
