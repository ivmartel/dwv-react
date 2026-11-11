import { vi } from 'vitest';

// mock dwv: a fake App that records calls and lets tests fire events
vi.mock('dwv', () => {
  class FakeApp {
    static instances = [];
    #listeners = {};
    viewLayers = {};
    metaData = {};
    dataIds = [];
    layerGroup = {
      drawLayers: [],
      getDrawLayers: vi.fn(function () {
        return this.drawLayers;
      }),
      setActiveLayerByDataId: vi.fn()
    };
    init = vi.fn();
    loadFiles = vi.fn();
    loadURLs = vi.fn();
    loadFromUri = vi.fn();
    setTool = vi.fn();
    setToolFeatures = vi.fn();
    setDataViewConfigs = vi.fn();
    render = vi.fn();
    resetZoomPan = vi.fn();
    defaultOnKeydown = vi.fn();
    onResize = vi.fn();
    constructor() {
      FakeApp.instances.push(this);
    }
    addEventListener(type, callback) {
      (this.#listeners[type] ??= []).push(callback);
    }
    fire(type, event = {}) {
      for (const callback of this.#listeners[type] ?? []) {
        callback({type, ...event});
      }
    }
    getActiveLayerGroup() {
      return this.layerGroup;
    }
    getViewLayersByDataId(dataId) {
      const vl = this.viewLayers[dataId];
      return vl ? [vl] : [];
    }
    getMetaData(dataId) {
      return this.metaData[dataId];
    }
    getDataIds() {
      return this.dataIds;
    }
  }
  class ViewConfig {
    constructor(divId) {
      this.divId = divId;
    }
  }
  class AppOptions {
    constructor(dataViewConfigs) {
      this.dataViewConfigs = dataViewConfigs;
    }
  }
  class ToolConfig {
    constructor(options) {
      this.options = options;
    }
  }
  return {
    App: FakeApp,
    ViewConfig,
    AppOptions,
    ToolConfig,
    getDwvVersion: () => '0.0.0-test'
  };
});

import { App } from 'dwv';
import { DwvAppService } from './DwvAppService.js';

const EVENT_TYPES = [
  'loadprogress', 'dataready', 'dataloaded',
  'presetnames', 'ismanualpreset', 'error'
];

/**
 * Create a service, its fake dwv app and an event recorder.
 *
 * @returns {object} {service, app, events, eventsOf}
 */
const setup = () => {
  const service = new DwvAppService();
  const app = App.instances.at(-1);
  const events = [];
  for (const type of EVENT_TYPES) {
    service.addEventListener(type, (event) => {
      events.push([type, event.detail.value]);
    });
  }
  const eventsOf = (type) =>
    events.filter((item) => item[0] === type).map((item) => item[1]);
  return {service, app, events, eventsOf};
};

/**
 * Create a fake view layer.
 *
 * @param {object} [options] Optional view controller results.
 * @returns {object} The view layer.
 */
const fakeViewLayer = ({
  canScroll = true,
  isMonochrome = true,
  presets = ['preset0', 'preset1']
} = {}) => {
  const vc = {
    canScroll: () => canScroll,
    isMonochrome: () => isMonochrome,
    getWindowLevelPresetsNames: () => presets,
    setWindowLevelPreset: vi.fn()
  };
  return {getViewController: () => vc};
};

/**
 * Simulate a successful dwv load: loadstart, renderend, load, loadend.
 *
 * @param {object} app The fake app.
 * @param {string} dataId The data id.
 * @param {object} [viewLayer] The view layer created at render.
 */
const simulateLoad = (app, dataId, viewLayer = fakeViewLayer()) => {
  app.fire('loadstart', {dataid: dataId});
  app.fire('loadprogress', {loaded: 50});
  app.viewLayers[dataId] = viewLayer;
  app.metaData[dataId] = {
    '00100010': {value: ['Doe^John']},
    '7FE00010': {value: ['pixels']}
  };
  app.dataIds.push(dataId);
  app.fire('renderend', {dataid: dataId});
  app.fire('load', {dataid: dataId});
  app.fire('loadend', {dataid: dataId});
};

describe('DwvAppService', () => {

  it('initialises the dwv app', () => {
    const {app, service} = setup();
    expect(app.init).toHaveBeenCalledTimes(1);
    const options = app.init.mock.calls[0][0];
    expect(options.dataViewConfigs['*'][0].divId).toBe('layerGroup0');
    expect(Object.keys(options.tools)).toEqual(service.getToolNames());
    expect(options.overlayConfig).toBeDefined();
    expect(service.getDwvVersion()).toBe('0.0.0-test');
  });

  it('forwards load calls', () => {
    const {app, service} = setup();
    service.loadFiles(['file']);
    service.loadURLs(['url']);
    service.loadFromUri('uri');
    expect(app.loadFiles).toHaveBeenCalledWith(['file']);
    expect(app.loadURLs).toHaveBeenCalledWith(['url']);
    expect(app.loadFromUri).toHaveBeenCalledWith('uri');
  });

  it('translates a first load into service events', () => {
    const {app, service, events} = setup();
    simulateLoad(app, '0', fakeViewLayer({canScroll: false}));

    expect(events).toEqual([
      ['dataready', false],
      ['dataloaded', false],
      ['loadprogress', 50],
      ['presetnames', ['preset0', 'preset1']],
      ['dataready', true],
      ['loadprogress', 100],
      ['dataloaded', true]
    ]);
    // tools from the view controller
    expect(service.canRunTool('Scroll')).toBe(false);
    expect(service.canRunTool('WindowLevel')).toBe(true);
    expect(service.canRunTool('Draw')).toBe(true);
    expect(service.getFirstRunnableTool()).toBe('ZoomAndPan');
    // meta data: copy without pixel data
    const meta = service.getMetaData();
    expect(meta['00100010'].value).toEqual(['Doe^John']);
    expect(meta['7FE00010']).toBeUndefined();
    expect(app.metaData['0']['7FE00010']).toBeDefined();
  });

  it('keeps the data loaded state when loading an overlay', () => {
    const {app, service, eventsOf} = setup();
    simulateLoad(app, '0');
    const overlayLayer = fakeViewLayer({presets: ['overlay0']});
    simulateLoad(app, '1', overlayLayer);

    // no reset on the second load start
    expect(eventsOf('dataloaded')).toEqual([false, true, true]);
    expect(eventsOf('dataready')).toEqual([false, true, true]);
    // presets and preset application follow the overlay
    expect(eventsOf('presetnames').at(-1)).toEqual(['overlay0']);
    service.applyPreset('overlay0');
    expect(overlayLayer.getViewController().setWindowLevelPreset)
      .toHaveBeenCalledWith('overlay0');
  });

  it('does not change the active data on a non rendered overlay', () => {
    const {app, service, eventsOf} = setup();
    simulateLoad(app, '0');
    // overlay rejected at render: no view layer, no renderend
    app.fire('loadstart', {dataid: '1'});
    app.fire('error', {error: new Error('incompatible geometries')});
    app.fire('load', {dataid: '1'});
    app.fire('loadend', {dataid: '1'});

    expect(eventsOf('error')).toEqual(['Load error: incompatible geometries']);
    expect(eventsOf('dataloaded').at(-1)).toBe(true);
    service.applyTool('Scroll');
    expect(app.layerGroup.setActiveLayerByDataId).toHaveBeenLastCalledWith('0');

    // a later render of '1' is not taken as a first render
    app.fire('renderend', {dataid: '1'});
    expect(eventsOf('dataready').at(-1)).toBe(true);
    expect(eventsOf('dataready')).toHaveLength(2);
  });

  describe('errors', () => {
    let consoleError;
    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      consoleError.mockRestore();
    });

    it('reports load errors once at load end', () => {
      const {app, eventsOf} = setup();
      app.fire('loadstart', {dataid: '0'});
      // dwv 0.36 fires load errors as 'error'
      app.fire('error', {error: new Error('bad file')});
      app.fire('loaderror', {error: new Error('other bad file')});
      expect(eventsOf('error')).toEqual([]);
      app.fire('loadend', {dataid: '0'});

      expect(eventsOf('error')).toEqual([
        'Load error: bad file (+1 more, check log for details)'
      ]);
      expect(eventsOf('loadprogress').at(-1)).toBe(0);
      expect(consoleError).toHaveBeenCalledTimes(2);
    });

    it('reports errors outside of a load immediately', () => {
      const {app, eventsOf} = setup();
      app.fire('error', {error: new Error('render error')});
      expect(eventsOf('error')).toEqual(['render error']);
    });

    it('reports aborts', () => {
      const {app, eventsOf} = setup();
      app.fire('loadstart', {dataid: '0'});
      app.fire('abort');
      app.fire('loadend', {dataid: '0'});
      expect(eventsOf('error')).toEqual(['Load was aborted.']);
      expect(eventsOf('loadprogress').at(-1)).toBe(0);
    });
  });

  describe('applyTool', () => {
    it('sets the tool and features', () => {
      const {app, service} = setup();
      simulateLoad(app, '0');
      service.applyTool('Draw', {shapeName: 'Ruler'});
      expect(app.setTool).toHaveBeenCalledWith('Draw');
      expect(app.setToolFeatures).toHaveBeenCalledWith({shapeName: 'Ruler'});
      service.applyTool('Scroll');
      expect(app.setToolFeatures).toHaveBeenCalledTimes(1);
    });

    it('activates the active image for non draw tools', () => {
      const {app, service} = setup();
      simulateLoad(app, '0');
      simulateLoad(app, '1');
      service.applyTool('WindowLevel');
      expect(app.layerGroup.setActiveLayerByDataId)
        .toHaveBeenLastCalledWith('1');
    });

    it('reuses the last draw layer for the draw tool', () => {
      const {app, service} = setup();
      simulateLoad(app, '0');
      // no draw layer yet: draw on the active image
      service.applyTool('Draw');
      expect(app.layerGroup.setActiveLayerByDataId)
        .toHaveBeenLastCalledWith('0');
      // existing draw layers
      app.layerGroup.drawLayers = [
        {getDataId: () => 'draw0'},
        {getDataId: () => 'draw1'}
      ];
      service.applyTool('Draw');
      expect(app.layerGroup.setActiveLayerByDataId)
        .toHaveBeenLastCalledWith('draw1');
    });

    it('does nothing on layers before data is loaded', () => {
      const {app, service} = setup();
      service.applyTool('Scroll');
      expect(app.setTool).toHaveBeenCalledWith('Scroll');
      expect(app.layerGroup.setActiveLayerByDataId).not.toHaveBeenCalled();
    });
  });

  describe('window level presets', () => {
    it('adds and selects the manual preset on manual change', () => {
      const {app, eventsOf} = setup();
      simulateLoad(app, '0');
      app.fire('wlchange', {value: [10, 20, 'manual']});
      app.fire('wlchange', {value: [10, 30, 'manual']});
      expect(eventsOf('presetnames').at(-1))
        .toEqual(['preset0', 'preset1', 'manual']);
      // 'manual' added once
      expect(eventsOf('presetnames')).toHaveLength(2);
      expect(eventsOf('ismanualpreset')).toEqual([true, true]);
      app.fire('wlchange', {value: [10, 20, 'preset0']});
      expect(eventsOf('ismanualpreset').at(-1)).toBe(false);
    });

    it('handles a manual change before any render', () => {
      const {app, eventsOf} = setup();
      expect(() => app.fire('wlchange', {value: [1, 2, 'manual']}))
        .not.toThrow();
      expect(eventsOf('presetnames')).toEqual([['manual']]);
    });

    it('ignores presets without active data', () => {
      const {service} = setup();
      expect(() => service.applyPreset('preset0')).not.toThrow();
    });
  });

  it('cycles orientations and re-renders all data', () => {
    const {app, service} = setup();
    simulateLoad(app, '0');
    simulateLoad(app, '1');
    const orientations = [];
    for (let i = 0; i < 4; ++i) {
      service.toggleOrientation();
      const configs = app.setDataViewConfigs.mock.calls.at(-1)[0];
      orientations.push(configs['*'][0].orientation);
    }
    expect(orientations).toEqual(['coronal', 'sagittal', 'axial', 'coronal']);
    expect(app.render).toHaveBeenCalledTimes(8);
    expect(app.render).toHaveBeenCalledWith('1');
  });

  it('resets the zoom and pan', () => {
    const {app, service} = setup();
    service.reset();
    expect(app.resetZoomPan).toHaveBeenCalledTimes(1);
  });

  it('connects and disconnects the window resize listener', () => {
    const {app, service} = setup();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    service.connect();
    expect(add).toHaveBeenCalledWith('resize', app.onResize);
    service.disconnect();
    expect(remove).toHaveBeenCalledWith('resize', app.onResize);
    add.mockRestore();
    remove.mockRestore();
  });

  it('fits the view on resize', () => {
    const {app, service} = setup();
    service.resize();
    expect(app.onResize).toHaveBeenCalledTimes(1);
  });

  it('forwards key events to dwv', () => {
    const {app} = setup();
    const event = {key: 'a'};
    app.fire('keydown', event);
    expect(app.defaultOnKeydown).toHaveBeenCalledWith(
      expect.objectContaining({key: 'a'})
    );
  });
});
