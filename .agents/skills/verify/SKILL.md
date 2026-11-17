---
name: verify
description: Verify a dwv-react change before considering it done - write or update tests, run lint and tests, keep the test output clean and review the change against the AGENTS.md conventions. Use after any code change, when writing tests, or when test output shows console logs or React act(...) warnings.
---

# Verify

## Steps

1. Add or update tests for the changed services and components.
2. Run `yarn lint`.
3. Run `yarn test-ci` (single run with coverage, as in CI).
4. Check the test output is clean (see below).
5. Review the diff against the `AGENTS.md` conventions (dwv logic in
   services, components through provider hooks, theme tokens, JSDoc,
   no dwv patching, pinned `dwv`).

## Tests

- Vitest with jsdom and globals (`describe`, `it`, `expect`, `vi`), plus
  React Testing Library. Tests are co-located: `Foo.jsx` -> `Foo.test.jsx`.
- dwv is mocked with `vi.mock('dwv', ...)` (see
  `DwvAppService.test.js`); do not rely on real image rendering.
- Prefer querying by role/accessible name (`getByRole('button',
  {name: ...})`), and add tests for new services and components.
- Keep the test output clean: no console logs, no React `act(...)`
  warnings. Without a TTY, Vitest's default reporter hides test stderr:
  check with `yarn vitest run --reporter=verbose 2>&1 | grep -E
  "stderr|not wrapped"`.
- When a test triggers code that logs (for example an expected error
  sent to `console.error`), spy on the console method, mock it to
  silence the output and assert the call, then restore it:
  `vi.spyOn(console, 'error').mockImplementation(() => {})`, then
  `expect(spy).toHaveBeenCalledTimes(1)` and `spy.mockRestore()`.
- MUI buttons start their focus ripple asynchronously: if an
  interaction moves the focus to a button, run it in
  `await act(async () => {...})` to avoid `act(...)` warnings (see
  `RightPanel.test.jsx`).
