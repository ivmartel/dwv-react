import {
  App,
  AppOptions,
  ViewConfig,
  ToolConfig,
  getDwvVersion
} from 'dwv';
import { overlayConfig } from './overlays';

/**
 * DWV service.
 */
export class DwvAppService extends EventTarget {
  /**
   * List of annotation shape names.
   *
   * @type {string[]}
   */
  #shapeNames = [
    'Ruler',
    'Arrow',
    'Rectangle',
    'Circle',
    'Ellipse',
    'Protractor',
    'Roi'
  ];

  /**
   * List of tools.
   *
   * @type {object}
   */
  #tools = {
    Scroll: new ToolConfig(),
    ZoomAndPan: new ToolConfig(),
    WindowLevel: new ToolConfig(),
    Draw: new ToolConfig(this.#shapeNames),
  };
  /**
   * List of tool names.
   *
   * @type {string[]}
   */
  #toolNames = Object.keys(this.#tools);

  /**
   * Can scroll flag.
   *
   * @type {boolean}
   */
  #canScroll = false;
  /**
   * Can window level flag.
   *
   * @type {boolean}
   */
  #canWindowLevel = false;

  /**
   * Orientation name.
   *
   * @type {string}
   */
  #orientation;

  /**
   * Name of the main layer group.
   *
   * @type {string}
   */
  #layerGroupName;

  /**
   * DWV app.
   *
   * @type {App}
   */
  #dwvApp = new App();

  /**
   * Meta data of the loaded data.
   *
   * @type {object}
   */
  #metaData;

  /**
   * List of preset names: set after first render
   *   (empty before, so that 'wlchange' can safely use it).
   *
   * @type {string[]}
   */
  #presetNames = [];

  /**
   * Data id of the active image: the last image that was
   *   successfully rendered. Undefined if no image is displayed.
   * Data loaded after the first one is displayed as an overlay
   *   and becomes the active image.
   *
   * @type {string|undefined}
   */
  #activeDataId;

  constructor() {
    super();

    // initialise app
    this.#layerGroupName = 'layerGroup0';
    const viewConfig0 = new ViewConfig(this.#layerGroupName);
    const viewConfigs = {'*': [viewConfig0]};
    const appOptions = new AppOptions(viewConfigs);
    appOptions.tools = this.#tools;
    appOptions.overlayConfig = overlayConfig;
    this.#dwvApp.init(appOptions);
    // setup listeners
    this.#setupLoadListeners();
    this.#setupListeners();
  }

  /**
   * Get the DWV version.
   *
   * @returns {string} The version.
   */
  getDwvVersion() {
    return getDwvVersion();
  }

  /**
   * Get the list of tool names.
   *
   * @returns {string[]} The list of names.
   */
  getToolNames() {
    return this.#toolNames;
  }

  /**
   * Get the list of annotation shape names.
   *
   * @returns {string[]} The list of names.
   */
  getShapeNames() {
    return this.#shapeNames;
  }

  /**
   * Get the meta data of the loaded data.
   *
   * @returns {object} The meta data.
   */
  getMetaData() {
    return this.#metaData;
  }

  /**
   * Dispatch a CustomEvent.
   *
   * @param {string} type The event type.
   * @param {object} value Teh event value.
   */
  #dispatch(type, value) {
    this.dispatchEvent(
      new CustomEvent(type, {detail: value})
    );
  }

  /**
   * List of preset names: set after first render.
   *
   * @param {string[]} value The names.
   */
  #setPresetNames(value) {
    this.#presetNames = value;
    this.#dispatch('presetnames', {value});
  }

  /**
   * Setup the DWV app load listeners.
   */
  #setupLoadListeners() {
    // handle load events
    // error messages received during the current load(s)
    let loadErrors = [];
    let nReceivedLoadAbort = 0;
    // ids of the loading data that have not been rendered yet
    const notYetRendered = new Set();
    // ids of the data being loaded
    const loading = new Set();
    this.#dwvApp.addEventListener('loadstart', (event) => {
      // reset flags only if there is no displayed data:
      // otherwise the new data will be an overlay
      if (this.#activeDataId === undefined) {
        this.#dispatch('dataready', {value: false});
        this.#dispatch('dataloaded', {value: false});
      }
      loadErrors = [];
      nReceivedLoadAbort = 0;
      notYetRendered.add(event.dataid);
      loading.add(event.dataid);
    });
    this.#dwvApp.addEventListener('loadprogress', (event) => {
      this.#dispatch('loadprogress', {value: event.loaded});
    });
    this.#dwvApp.addEventListener('renderend', (event) => {
      if (notYetRendered.has(event.dataid)) {
        notYetRendered.delete(event.dataid);
        this.#activeDataId = event.dataid;
        const vl = this.#dwvApp.getViewLayersByDataId(event.dataid)[0];
        const vc = vl.getViewController();
        // available tools
        this.#canScroll = vc.canScroll();
        this.#canWindowLevel = vc.isMonochrome();
        // get window level presets
        this.#setPresetNames(vc.getWindowLevelPresetsNames());
        // set data ready flag
        this.#dispatch('dataready', {value: true});
      }
    });
    this.#dwvApp.addEventListener('load', (event) => {
      // set dicom tags if the data is displayed
      // (an overlay can be rejected at render, see 'error')
      if (event.dataid === this.#activeDataId) {
        this.#metaData =
          structuredClone(this.#dwvApp.getMetaData(event.dataid));
        const pixelDataKey = '7FE00010';
        if (typeof this.#metaData[pixelDataKey] !== 'undefined') {
          delete this.#metaData[pixelDataKey];
        }
      }
      // force progress
      this.#dispatch('loadprogress', {value: 100});
      // set data loaded flag
      this.#dispatch('dataloaded', {value: this.#activeDataId !== undefined});
    });
    this.#dwvApp.addEventListener('loadend', (event) => {
      notYetRendered.delete(event.dataid);
      loading.delete(event.dataid);
      if (loadErrors.length !== 0) {
        this.#dispatch('loadprogress', {value: 0});
        let message = 'Load error: ' + loadErrors[0];
        if (loadErrors.length > 1) {
          message += ' (+' + (loadErrors.length - 1) +
            ' more, check log for details)';
        }
        this.#dispatch('error', {value: message});
        loadErrors = [];
      }
      if (nReceivedLoadAbort) {
        this.#dispatch('loadprogress', {value: 0});
        this.#dispatch('error', {value: 'Load was aborted.'});
        nReceivedLoadAbort = 0;
      }
    });
    // dwv (0.36) fires load errors as 'error' (and aborts as 'abort'),
    // render errors (for example an overlay with incompatible
    // geometry) are also fired as 'error'
    const onError = (event) => {
      console.error(event.error);
      const message = event.error?.message ?? String(event.error);
      if (loading.size !== 0) {
        // reported at load end
        loadErrors.push(message);
      } else {
        this.#dispatch('error', {value: message});
      }
    };
    this.#dwvApp.addEventListener('loaderror', onError);
    this.#dwvApp.addEventListener('error', onError);
    const onAbort = () => {
      ++nReceivedLoadAbort;
    };
    this.#dwvApp.addEventListener('loadabort', onAbort);
    this.#dwvApp.addEventListener('abort', onAbort);
  }

  /**
   * Setup the DWV app generic listeners.
   */
  #setupListeners() {
    // listen to 'wlchange' to flag a manual change
    // and update the presets if necessary
    this.#dwvApp.addEventListener('wlchange', (event) => {
      // value: [center, width, name]
      const manualStr = 'manual';
      if (event.value[2] === manualStr) {
        if (!this.#presetNames.includes(manualStr)) {
          this.#setPresetNames([...this.#presetNames, manualStr]);
        }
        this.#dispatch('ismanualpreset', {value: true});
      } else {
        this.#dispatch('ismanualpreset', {value: false});
      }
    });

    // handle key events
    this.#dwvApp.addEventListener('keydown', (event) => {
      this.#dwvApp.defaultOnKeydown(event);
    });
  }

  /**
   * Start listening to window events (resize).
   * Call `disconnect` to stop.
   */
  connect() {
    window.addEventListener('resize', this.#dwvApp.onResize);
  }

  /**
   * Stop listening to window events.
   */
  disconnect() {
    window.removeEventListener('resize', this.#dwvApp.onResize);
  }

  /**
   * Load a list of urls.
   *
   * @param {string[]} urls The urls.
   */
  loadURLs(urls) {
    this.#dwvApp.loadURLs(urls);
  }

  /**
   * Load a from uri.
   *
   * @param {string} uri The uri.
   */
  loadFromUri(uri) {
    this.#dwvApp.loadFromUri(uri);
  }

  /**
   * Load a list of files.
   *
   * @param {File[]} files The files.
   */
  loadFiles(files) {
    this.#dwvApp.loadFiles(files);
  }

  /**
   * Check if a tool can be run.
   *
   * @param {string} toolName The tool name.
   * @returns {boolean|undefined} True if the tool can be run,
   *   undefined if unknown.
   */
  canRunTool(toolName) {
    let res;
    if (toolName === 'Scroll') {
      res = this.#canScroll;
    } else if (toolName === 'WindowLevel') {
      res = this.#canWindowLevel;
    } else if (this.#toolNames.includes(toolName)) {
      res = true;
    } else {
      console.log('Unknwon tool', toolName);
    }
    return res;
  }

  /**
   * Get the first runnable tool name from the list of tools.
   *
   * @returns {string} The tool name.
   */
  getFirstRunnableTool() {
    return this.#toolNames.find((item) => this.canRunTool(item));
  }

  /**
   * Apply a tool: set it to dwv.
   *
   * @param {string} toolName The tool name.
   * @param {object} features Optional tool features.
   */
  applyTool(toolName, features) {
    this.#dwvApp.setTool(toolName);
    if (features !== undefined) {
      this.#dwvApp.setToolFeatures(features);
    }

    const lg = this.#dwvApp.getActiveLayerGroup();
    if (lg === undefined) {
      return;
    }
    if (toolName === 'Draw') {
      // reuse the last created draw layer if any
      // (otherwise the draw tool will create one on the active image)
      const drawLayers = lg.getDrawLayers();
      if (drawLayers.length !== 0) {
        lg.setActiveLayerByDataId(drawLayers.at(-1).getDataId());
      } else if (this.#activeDataId !== undefined) {
        lg.setActiveLayerByDataId(this.#activeDataId);
      }
    } else if (this.#activeDataId !== undefined) {
      // if draw was created, active is now a draw layer...
      // reset to the active image
      lg.setActiveLayerByDataId(this.#activeDataId);
    }
  }

  /**
   * Apply a window level preset: set it to dwv.
   *
   * @param {string} presetName The preset name.
   */
  applyPreset(presetName) {
    if (this.#activeDataId === undefined) {
      return;
    }
    const vl = this.#dwvApp.getViewLayersByDataId(this.#activeDataId)[0];
    vl?.getViewController().setWindowLevelPreset(presetName);
  }

  /**
   * Toogle between possible orientations.
   */
  toggleOrientation() {
    if (typeof this.#orientation !== 'undefined') {
      if (this.#orientation === 'axial') {
        this.#orientation = 'coronal';
      } else if (this.#orientation === 'coronal') {
        this.#orientation = 'sagittal';
      } else if (this.#orientation === 'sagittal') {
        this.#orientation = 'axial';
      }
    } else {
      // default is most probably axial
      this.#orientation = 'coronal';
    }
    // update data view config
    const viewConfig0 = new ViewConfig(this.#layerGroupName);
    viewConfig0.orientation = this.#orientation;
    const viewConfigs = {'*': [viewConfig0]};
    this.#dwvApp.setDataViewConfigs(viewConfigs);
    // render data
    const dataIds = this.#dwvApp.getDataIds();
    for (const dataId of dataIds) {
      this.#dwvApp.render(dataId);
    }
  }

  /**
   * Reset the layout.
   */
  reset() {
    this.#dwvApp.resetZoomPan();
  }
}
