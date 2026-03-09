import {render, screens} from '@testing-library/react'
import { DwvServiceProvider } from './DwvServiceProvider.jsx';

import DwvComponent from './DwvComponent.jsx';

describe('DwvComponent', () => {
  // Inspect the component instance on mount
  it('renders without crashing', () => {
    render(
      <DwvServiceProvider>
        <DwvComponent />
      </DwvServiceProvider>
    );
  });

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', () => {
    const { container } = render(
      <DwvServiceProvider>
        <DwvComponent />
      </DwvServiceProvider>
    );

    const legend = container.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  })
})
