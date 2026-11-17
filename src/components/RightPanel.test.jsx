import { act, render, screen, fireEvent } from '@testing-library/react';

import RightPanel from './RightPanel.jsx';
import { DwvAppServiceContext } from '../services/DwvAppServiceProvider.jsx';

// fake dwv app service: only provides the element ids
const dwvAppService = {getElementId: (name) => `v0-${name}`};

/**
 * Render a panel inside a (fake) viewer context.
 *
 * @returns {object} The render result.
 */
const renderPanel = () => render(
  <DwvAppServiceContext.Provider value={dwvAppService}>
    <RightPanel><p>panel content</p></RightPanel>
  </DwvAppServiceContext.Provider>
);

/**
 * Click the toggle button with the given name. The click moves the
 *   focus to the new toggle whose (lazy) MUI focus ripple starts
 *   asynchronously: awaiting an async act lets it settle.
 *
 * @param {string} name The toggle accessible name.
 */
const clickToggle = async (name) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', {name: name}));
  });
};

/**
 * Render an open panel with a mocked pointer capture on its handle.
 *
 * @returns {Promise<{panel: HTMLElement, handle: HTMLElement}>} The panel
 *   and its resize handle.
 */
const renderOpen = async () => {
  renderPanel();
  await clickToggle('Open panel');
  const handle = screen.getByRole('separator', {name: 'Resize panel'});
  handle.setPointerCapture = () => {};
  handle.releasePointerCapture = () => {};
  return {panel: document.getElementById('v0-rightPanel'), handle};
};

describe('RightPanel', () => {
  beforeEach(() => {
    window.innerWidth = 1000;
  });

  it('is closed by default', () => {
    renderPanel();
    const panel = document.getElementById('v0-rightPanel');
    expect(panel.tagName).toBe('ASIDE');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');
    expect(panel.style.width).toBe('0px');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', {name: 'Open panel'});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'v0-rightPanel');
  });

  it('opens and closes on toggle, moving the focus', async () => {
    renderPanel();
    await clickToggle('Open panel');
    const panel = document.getElementById('v0-rightPanel');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(panel.style.width).toBe('300px');
    expect(screen.getByText('panel content')).toBeVisible();
    const close = screen.getByRole('button', {name: 'Close panel'});
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(close).toHaveFocus();
    expect(screen.queryByRole('button', {name: 'Open panel'}))
      .not.toBeInTheDocument();

    await clickToggle('Close panel');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', {name: 'Open panel'})).toHaveFocus();
  });

  it('exposes the resize handle values', async () => {
    const {handle} = await renderOpen();
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-controls', 'v0-rightPanel');
    expect(handle).toHaveAttribute('aria-valuenow', '300');
    expect(handle).toHaveAttribute('aria-valuemin', '200');
    expect(handle).toHaveAttribute('aria-valuemax', '500');
    expect(handle).toHaveAttribute('tabindex', '0');
  });

  it('resizes when dragging the handle', async () => {
    const {panel, handle} = await renderOpen();

    // other buttons are ignored
    fireEvent.pointerDown(handle, {pointerId: 1, button: 2, clientX: 700});
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 600});
    expect(panel.style.width).toBe('300px');

    fireEvent.pointerDown(handle, {pointerId: 1, button: 0, clientX: 700});
    expect(panel).toHaveClass('resizing');
    // moving left widens
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 600});
    expect(panel.style.width).toBe('400px');
    // clamped to the minimum width
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 990});
    expect(panel.style.width).toBe('200px');
    // clamped to the maximum width (half the window)
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 0});
    expect(panel.style.width).toBe('500px');
    // no resize after release
    fireEvent.pointerUp(handle, {pointerId: 1});
    expect(panel).not.toHaveClass('resizing');
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 600});
    expect(panel.style.width).toBe('500px');
  });

  it('resizes with the keyboard', async () => {
    const {panel, handle} = await renderOpen();
    fireEvent.keyDown(handle, {key: 'ArrowLeft'});
    expect(panel.style.width).toBe('320px');
    fireEvent.keyDown(handle, {key: 'ArrowRight'});
    fireEvent.keyDown(handle, {key: 'ArrowRight'});
    expect(panel.style.width).toBe('280px');
    fireEvent.keyDown(handle, {key: 'End'});
    expect(panel.style.width).toBe('500px');
    fireEvent.keyDown(handle, {key: 'Home'});
    expect(panel.style.width).toBe('200px');
    fireEvent.keyDown(handle, {key: 'ArrowRight'});
    expect(panel.style.width).toBe('200px');
  });

  it('keeps the width while closed', async () => {
    const {panel, handle} = await renderOpen();
    fireEvent.keyDown(handle, {key: 'ArrowLeft'});
    await clickToggle('Close panel');
    expect(panel.style.width).toBe('0px');
    await clickToggle('Open panel');
    expect(panel.style.width).toBe('320px');
  });
});
