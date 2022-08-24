import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import DwvComponent from './DwvComponent';

describe('DwvComponent', () => {
  let container = null;
  let root = null;
  beforeEach(() => {
    // allow act()
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    // setup a DOM element as a render target
    container = document.createElement("div");
    root = createRoot(container);
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => {
      // cleanup on exiting
      root.unmount();
      container.remove();
      container = null;
    });
  });

  // Inspect the component instance on mount
  it('renders without crashing', () => {
    act(() => {
      root.render(<DwvComponent />);
    });
  });

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', () => {
    act(() => {
      root.render(<DwvComponent />);
    });
    const legend = container.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  })
})
