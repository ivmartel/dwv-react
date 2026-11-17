import { act, render, screen, within } from '@testing-library/react';
import {
  DwvAppServiceProvider,
  useDwvAppService
} from '../services/DwvAppServiceProvider.jsx';
import {
  AnnotationServiceProvider
} from '../services/AnnotationServiceProvider.jsx';
import { DwvAppService } from '../services/DwvAppService.js';

import DwvViewer, { getUrlList } from './DwvViewer.jsx';

/**
 * Wrap the component in its service providers.
 *
 * @param {object} props The component properties.
 * @returns {JSX.Element} The wrapped component.
 */
const Viewer = ({ onService, ...props }) => (
  <DwvAppServiceProvider>
    <AnnotationServiceProvider>
      {onService && <ServiceProbe onService={onService} />}
      <DwvViewer {...props} />
    </AnnotationServiceProvider>
  </DwvAppServiceProvider>
);

/**
 * Give access to the viewer service.
 *
 * @param {object} props The component properties.
 * @param {Function} props.onService Called with the service.
 * @returns {null} Nothing.
 */
const ServiceProbe = ({ onService }) => {
  onService(useDwvAppService());
  return null;
};

describe('getUrlList', () => {
  it('splits white space separated urls', () => {
    expect(getUrlList(undefined)).toEqual([]);
    expect(getUrlList('')).toEqual([]);
    expect(getUrlList(' a.dcm  b.dcm\nc.dcm ')).toEqual(
      ['a.dcm', 'b.dcm', 'c.dcm']);
  });
});

describe('DwvViewer', () => {
  let loadFromUri;
  let loadURLs;

  beforeEach(() => {
    loadFromUri = vi.spyOn(DwvAppService.prototype, 'loadFromUri')
      .mockImplementation(() => {});
    loadURLs = vi.spyOn(DwvAppService.prototype, 'loadURLs')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('renders without crashing', () => {
    render(<Viewer />);
  });

  it('builds unique element ids for several viewers', () => {
    const { container } = render(<><Viewer /><Viewer /></>);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    const layerGroups = container.querySelectorAll('.layerGroup');
    expect(layerGroups).toHaveLength(2);
    expect(layerGroups[0].id).toMatch(/-layerGroup$/);
    expect(layerGroups[1].id).toMatch(/-layerGroup$/);
    expect(layerGroups[0].id).not.toBe(layerGroups[1].id);
  });

  it('hides the legend by default', () => {
    const { container } = render(<Viewer />);
    expect(container.querySelector('.legend')).toBeNull();
  });

  it('shows the legend with showLegend', () => {
    const { container } = render(<Viewer showLegend />);
    const legend = container.querySelector('.legend');
    expect(legend.textContent).toContain('Powered by');
  });

  it('loads nothing without inputs', () => {
    window.history.replaceState(null, '', '/?input=a.dcm');
    render(<Viewer />);
    expect(loadFromUri).not.toHaveBeenCalled();
    expect(loadURLs).not.toHaveBeenCalled();
  });

  it('loads the uri first', () => {
    window.history.replaceState(null, '', '/?input=a.dcm');
    render(<Viewer uri="https://x.org/?input=b.dcm" urls="c.dcm"
      loadFromWindowLocation />);
    expect(loadFromUri).toHaveBeenCalledTimes(1);
    expect(loadFromUri).toHaveBeenCalledWith('https://x.org/?input=b.dcm');
    expect(loadURLs).not.toHaveBeenCalled();
  });

  it('loads the urls if no uri', () => {
    window.history.replaceState(null, '', '/?input=a.dcm');
    render(<Viewer urls="b.dcm c.dcm" loadFromWindowLocation />);
    expect(loadURLs).toHaveBeenCalledTimes(1);
    expect(loadURLs).toHaveBeenCalledWith(['b.dcm', 'c.dcm']);
    expect(loadFromUri).not.toHaveBeenCalled();
  });

  it('loads from the window location with search arguments', () => {
    window.history.replaceState(null, '', '/?input=a.dcm');
    render(<Viewer loadFromWindowLocation />);
    expect(loadFromUri).toHaveBeenCalledTimes(1);
    expect(loadFromUri).toHaveBeenCalledWith(window.location.href);
  });

  it('does not load from a window location without search', () => {
    render(<Viewer loadFromWindowLocation />);
    expect(loadFromUri).not.toHaveBeenCalled();
  });

  it('loads new uri and urls values', () => {
    const { rerender } = render(<Viewer uri="https://x.org/?input=a.dcm" />);
    expect(loadFromUri).toHaveBeenCalledTimes(1);

    // same values: no load (empty urls)
    rerender(<Viewer uri="https://x.org/?input=a.dcm" urls="" />);
    expect(loadFromUri).toHaveBeenCalledTimes(1);
    expect(loadURLs).not.toHaveBeenCalled();

    rerender(<Viewer uri="https://x.org/?input=b.dcm" urls="" />);
    expect(loadFromUri).toHaveBeenCalledTimes(2);
    expect(loadFromUri).toHaveBeenLastCalledWith('https://x.org/?input=b.dcm');

    rerender(<Viewer uri="https://x.org/?input=b.dcm" urls="c.dcm" />);
    expect(loadURLs).toHaveBeenCalledTimes(1);
    expect(loadURLs).toHaveBeenCalledWith(['c.dcm']);

    // same list (only white space differs): no load
    rerender(<Viewer uri="https://x.org/?input=b.dcm" urls=" c.dcm " />);
    expect(loadURLs).toHaveBeenCalledTimes(1);
    expect(loadFromUri).toHaveBeenCalledTimes(2);
  });

  it('attaches the tags dialog to its viewer', async () => {
    vi.spyOn(DwvAppService.prototype, 'getMetaData').mockReturnValue({});
    const services = [];
    const { container } = render(<>
      <Viewer onService={(service) => services[0] = service} />
      <Viewer onService={(service) => services[1] = service} />
    </>);
    const viewers = container.querySelectorAll('.dwv');
    act(() => {
      services[1].dispatchEvent(
        new CustomEvent('dataloaded', {detail: {value: true}}));
    });
    await act(async () => {
      within(viewers[1]).getByTitle('Tags').click();
    });
    const dialog = screen.getByRole('dialog');
    expect(viewers[1]).toContainElement(dialog);
    expect(viewers[0]).not.toContainElement(dialog);
  });
});
