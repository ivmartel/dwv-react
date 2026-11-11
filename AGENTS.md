# AGENTS.md

Guidance for AI coding agents working on dwv-react: a medical (DICOM) viewer
built with [dwv](https://github.com/ivmartel/dwv), React 19 and MUI, bundled
with Vite. Its layout and features are inspired by the dwv development
viewer (([`dev/viewer`](https://github.com/ivmartel/dwv/tree/develop/dev/viewer) in the dwv repository)); look there for reference
behaviour when adding features. Not certified for diagnostic
use. License: GPL-3.0.

## Commands

Package manager is Yarn 4 (via Corepack). Node 24 is used in CI.

- `yarn install` - install dependencies (CI uses `--immutable`)
- `yarn dev` - dev server with hot reload (Vite, http://localhost:5173)
- `yarn lint` - ESLint
- `yarn test` - Vitest in watch mode; `yarn test run` for a single run
- `yarn test-ci` - single run with coverage (as in CI)
- `yarn build` - production build to `dist/`

Before considering a change done, run `yarn lint` and `yarn test-ci`:
CI (`.github/workflows/nodejs-ci.yml`) runs lint, tests and build on every
push and PR.

## Layout

- `src/main.jsx`, `src/App.jsx` - entry point, MUI theme (light/dark from
  `prefers-color-scheme`, custom `background.surfaceContainer` token for
  side panels) and service providers.
- `src/services/` - framework-independent logic wrapping dwv:
  - `DwvAppService.js` - owns the dwv `App`; extends `EventTarget` and
    re-dispatches selected dwv events as `CustomEvent`s.
  - `AnnotationService.js` - annotation state; mapped to dwv's
    `dev/viewer/src/annotationService.js`, adapted to the released dwv API.
  - `*Provider.jsx` - React contexts exposing the services
    (`useDwvAppService`, `useAnnotationService`, `useAnnotationState`).
  - `overlays.js`, `quantification.js` - helpers.
- `src/components/` - React function components (`DwvComponent`,
  `AnnotationComponent`, `RightPanel`, `TagsTable`, header/footer...),
  each with a co-located `.css` file when needed.
- `tests/setup.js` - Vitest setup (jest-dom matchers, cleanup).
- `public/assets/workers/` - vendored, minified dwv web workers. They are
  not bundled automatically: update them when the `dwv` version changes.
  Do not edit or lint them.

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
  through the provider hooks and render state. When a file mirrors a dwv
  viewer file, keep the header comment that says so and stay close to it.
- UI uses MUI components and `@mui/icons-material`; use theme tokens
  rather than hard-coded colours.
- Keep custom styling to a minimum and follow the
  [Material Design](https://m3.material.io/) guidelines: prefer MUI
  component props and the theme over custom CSS or `sx` overrides.
- Style: 2-space indent, single quotes, semicolons, private class fields
  (`#field`) for service internals. Unused args must be prefixed with `_`.
- Pin `dwv` to an exact version.

## Tests

- Vitest with jsdom and globals (`describe`, `it`, `expect`, `vi`), plus
  React Testing Library. Tests are co-located: `Foo.jsx` -> `Foo.test.jsx`.
- dwv is mocked with `vi.mock('dwv', ...)` (see
  `DwvAppService.test.js`); do not rely on real image rendering.
- Prefer querying by role/accessible name (`getByRole('button',
  {name: ...})`), and add tests for new services and components.

## Git

- Commit messages: short, imperative, capitalised, no trailing period
  (e.g. `Add annotation list, fixes #527`). Reference issues with
  `fixes #N` / `relates to #N`.
- Pushes to `main` deploy the trunk demo to `gh-pages`; non-beta tags
  deploy the stable demo.

## Notes

- Do not patch dwv (no edits in `node_modules/dwv`, no `patch-package` or Yarn patches, no monkey-patching at runtime). If a fix or feature is needed in dwv itself, propose a pull request to the [dwv repository](https://github.com/ivmartel/dwv) instead.
