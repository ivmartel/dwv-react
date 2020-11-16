import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import {act} from 'react-dom/test-utils';
import DwvComponent from './DwvComponent';

describe('DwvComponent', () => {
  let container = null;
  beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  // Inspect the component instance on mount
  it('renders without crashing', () => {
    act(() => {
      render(<DwvComponent />, container);
    });
  });

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', () => {
    act(() => {
      render(<DwvComponent />, container);
    });
    const legend = container.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  })
})
