import { render, screen, fireEvent } from '@testing-library/react';

import RightPanel from './RightPanel.jsx';

/**
 * Render an open panel with a mocked pointer capture on its handle.
 *
 * @returns {{panel: HTMLElement, handle: HTMLElement}} The panel
 *   and its resize handle.
 */
const renderOpen = () => {
  render(<RightPanel><p>panel content</p></RightPanel>);
  fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
  const handle = screen.getByRole('separator', {name: 'Resize panel'});
  handle.setPointerCapture = () => {};
  handle.releasePointerCapture = () => {};
  return {panel: document.getElementById('rightPanel'), handle};
};

describe('RightPanel', () => {
  beforeEach(() => {
    window.innerWidth = 1000;
  });

  it('is closed by default', () => {
    render(<RightPanel><p>panel content</p></RightPanel>);
    const panel = document.getElementById('rightPanel');
    expect(panel.tagName).toBe('ASIDE');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');
    expect(panel.style.width).toBe('0px');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', {name: 'Open panel'});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'rightPanel');
  });

  it('opens and closes on toggle, moving the focus', () => {
    render(<RightPanel><p>panel content</p></RightPanel>);
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    const panel = document.getElementById('rightPanel');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(panel.style.width).toBe('300px');
    expect(screen.getByText('panel content')).toBeVisible();
    const close = screen.getByRole('button', {name: 'Close panel'});
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(close).toHaveFocus();
    expect(screen.queryByRole('button', {name: 'Open panel'}))
      .not.toBeInTheDocument();

    fireEvent.click(close);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', {name: 'Open panel'})).toHaveFocus();
  });

  it('exposes the resize handle values', () => {
    const {handle} = renderOpen();
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-controls', 'rightPanel');
    expect(handle).toHaveAttribute('aria-valuenow', '300');
    expect(handle).toHaveAttribute('aria-valuemin', '200');
    expect(handle).toHaveAttribute('aria-valuemax', '500');
    expect(handle).toHaveAttribute('tabindex', '0');
  });

  it('resizes when dragging the handle', () => {
    const {panel, handle} = renderOpen();

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

  it('resizes with the keyboard', () => {
    const {panel, handle} = renderOpen();
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

  it('keeps the width while closed', () => {
    const {panel, handle} = renderOpen();
    fireEvent.keyDown(handle, {key: 'ArrowLeft'});
    fireEvent.click(screen.getByRole('button', {name: 'Close panel'}));
    expect(panel.style.width).toBe('0px');
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    expect(panel.style.width).toBe('320px');
  });
});
