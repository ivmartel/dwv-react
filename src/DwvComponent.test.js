import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import DwvComponent from './DwvComponent';

describe('DwvComponent', () => {
  // Inspect the component instance on mount
  it('renders the component', () => {
    const div = document.createElement('div');
    const component = ReactDOM.render(<DwvComponent />, div);
    expect(component).toBeDefined();
    expect(component).not.toBeNull();
  });

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', () => {
    const component = ReactTestUtils.renderIntoDocument(<DwvComponent />);
    const legend = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'legend');
    expect(legend.textContent).toContain('Powered by');
  })
})
