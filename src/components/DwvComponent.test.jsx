import { render } from '@testing-library/react'
import { DwvAppServiceProvider } from '../services/DwvAppServiceProvider.jsx';

import DwvComponent from './DwvComponent.jsx';

describe('DwvComponent', () => {
  // Inspect the component instance on mount
  it('renders without crashing', () => {
    render(
      <DwvAppServiceProvider>
        <DwvComponent />
      </DwvAppServiceProvider>
    );
  });

  // Mount an instance and inspect the render output
  it('renders the beginning of the legend', () => {
    const { container } = render(
      <DwvAppServiceProvider>
        <DwvComponent />
      </DwvAppServiceProvider>
    );

    const legend = container.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  })
})
