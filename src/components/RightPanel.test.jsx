import { render, screen, fireEvent } from '@testing-library/react';

import RightPanel from './RightPanel.jsx';

describe('RightPanel', () => {
  it('is closed by default', () => {
    render(<RightPanel><p>panel content</p></RightPanel>);
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('opens and closes on toggle', () => {
    render(<RightPanel><p>panel content</p></RightPanel>);
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    expect(screen.getByText('panel content')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Close panel'}));
    expect(screen.queryByText('panel content')).not.toBeInTheDocument();
  });

  it('resizes when dragging the handle', () => {
    const {container} = render(
      <div><RightPanel><p>panel content</p></RightPanel></div>
    );
    const parent = container.firstChild;
    parent.getBoundingClientRect = () => ({right: 1000, width: 1000});
    fireEvent.click(screen.getByRole('button', {name: 'Open panel'}));
    const handle = screen.getByRole('separator');
    handle.setPointerCapture = () => {};
    handle.releasePointerCapture = () => {};
    const panel = parent.firstChild;

    fireEvent.pointerDown(handle, {pointerId: 1, clientX: 700});
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 600});
    expect(panel.style.width).toBe('400px');
    // clamped to the minimum width
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 990});
    expect(panel.style.width).toBe('150px');
    // clamped to the maximum width
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 0});
    expect(panel.style.width).toBe('800px');
    // no resize after release
    fireEvent.pointerUp(handle, {pointerId: 1});
    fireEvent.pointerMove(handle, {pointerId: 1, clientX: 600});
    expect(panel.style.width).toBe('800px');
  });
});
