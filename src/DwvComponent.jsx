import {
  version,
  forwardRef,
  Component
} from 'react';
import { styled } from '@mui/material/styles';
import {
  Typography,
  LinearProgress,
  Link,
  IconButton,
  Button,
  AppBar,
  Dialog,
  Slide,
  Toolbar
} from '@mui/material';

import {
  App,
  getDwvVersion
} from 'dwv';

import {overlayConfig} from './overlays.js';
import TagsTable from './TagsTable.jsx';

// https://mui.com/material-ui/material-icons/
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import StraightenIcon from '@mui/icons-material/Straighten';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SportsRugbyIcon from '@mui/icons-material/SportsRugby';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import PolylineIcon from '@mui/icons-material/Polyline';

import './DwvComponent.css';

const PREFIX = 'DwvComponent';
const classes = {
  appBar: `${PREFIX}-appBar`,
  title: `${PREFIX}-title`,
  iconSmall: `${PREFIX}-iconSmall`
};

const Root = styled('div')(({theme}) => ({
  [`& .${classes.appBar}`]: {
    position: 'relative',
  },

  [`& .${classes.title}`]: {
    flex: '0 0 auto',
  },

  [`& .${classes.iconSmall}`]: {
    fontSize: 20,
  }
}));

export const TransitionUp = forwardRef((props, ref) => (
  <Slide direction="up" {...props} ref={ref} />
))

class DwvComponent extends Component {

  constructor(props) {
    super(props);
    const shapeNames = [
      'Ruler',
      'Arrow',
      'Rectangle',
      'Circle',
      'Ellipse',
      'Protractor',
      'Roi'
    ];
    const tools = {
      Scroll: {},
      ZoomAndPan: {},
      WindowLevel: {},
      Draw: {
        options: shapeNames
      }
    };

    this.state = {
      versions: {
        dwv: getDwvVersion(),
        react: version
      },
      shapeNames,
      selectedShape: shapeNames[0],
      tools,
      toolNames: Object.keys(tools),
      canScroll: false,
      canWindowLevel: false,
      presetNames: ['a', 'b'],
      selectedPreset: 'a',
      selectedTool: 'Select Tool',
      loadProgress: 0,
      dataLoaded: false,
      dwvApp: null,
      metaData: {},
      orientation: undefined,
      showDicomTags: false,
      dropboxDivId: 'dropBox',
      dropboxClassName: 'dropBox',
      borderClassName: 'dropBoxBorder',
      hoverClassName: 'hover'
    };
  }

  render() {
    const {
      versions,
      tools,
      selectedTool,
      loadProgress,
      dataLoaded,
      metaData,
      presetNames,
      selectedPreset,
      shapeNames,
      selectedShape
    } = this.state;

    const handleToolChange = (event) => {
      this.onChangeTool(event.currentTarget.value);
    };
    const handlePresetChange = (event) => {
      this.onChangePreset(event.currentTarget.value);
    };
    const handleShapeChange = (event) => {
      this.onChangeShape(event.currentTarget.value);
    };

    const toolsButtons = Object.keys(tools).map( (tool) => {
      let res = [
        <div key="{{ tool }}-item" className="toolbar-item">
          <Button
            value={tool}
            key={tool}
            title={tool}
            sx={{padding: "6px", minWidth: "20px"}}
            variant={tool === selectedTool? "outlined" : "contained"}
            disabled={!dataLoaded || !this.canRunTool(tool)}
            onClick={handleToolChange}>
            { this.getToolIcon(tool) }
          </Button>
        </div>
      ];
      if (tool === 'WindowLevel') {
        const toolName = tool + 'Select';
        res.push(
          <div key="wlselect-wrapper" className="select-wrapper">
            <Button
              value={toolName}
              key={toolName}
              title={toolName}
              sx={{padding: "6px", minWidth: "20px"}}
              variant="contained"
              disabled={!dataLoaded || !this.canRunTool(tool)}>
              <KeyboardArrowDownIcon />
            </Button>
            <select
              key="WindowLevelPresetsSelect"
              value={selectedPreset}
              onChange={handlePresetChange}>
              {presetNames.map((preset) => (
                <option
                  value={preset}
                  key={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>
        );
      } else if (tool === 'Draw') {
        const toolName = tool + 'Select';
        res.push(
          <div key="drawselect-wrapper" className="select-wrapper">
            <Button
              value={toolName}
              key={toolName}
              title={toolName}
              sx={{padding: "6px", minWidth: "20px"}}
              variant="contained"
              disabled={!dataLoaded || !this.canRunTool(tool)}>
              <KeyboardArrowDownIcon />
            </Button>
            <select
              key="DrawShapeSelect"
              value={selectedShape}
              onChange={handleShapeChange}>
              {shapeNames.map((shape) => (
                <option
                  value={shape}
                  key={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </div>
        );
      }

      return res;
    });

    return (
      <Root className={classes.root} id="dwv">
        <LinearProgress variant="determinate" value={loadProgress} />
        <div className="header">

          {toolsButtons}

          <div key="reset-item" className="toolbar-item">
            <Button
              value="reset"
              title="Reset"
              variant="contained"
              sx={{padding: "6px", minWidth: "20px"}}
              disabled={!dataLoaded}
              onChange={this.onReset}
            ><RefreshIcon /></Button>
          </div>

          <div key="orient-item" className="toolbar-item">
            <Button
              value="toggleOrientation"
              title="Toggle Orientation"
              variant="contained"
              sx={{padding: "6px", minWidth: "20px"}}
              disabled={!dataLoaded}
              onClick={this.toggleOrientation}
            ><CameraswitchIcon /></Button>
          </div>

          <div key="tags-item" className="toolbar-item">
            <Button
              value="tags"
              title="Tags"
              variant="contained"
              sx={{padding: "6px", minWidth: "20px"}}
              disabled={!dataLoaded}
              onClick={this.handleTagsDialogOpen}
            ><LibraryBooksIcon /></Button>
          </div>

          <Dialog
            open={this.state.showDicomTags}
            onClose={this.handleTagsDialogClose}
            slots={{ transition: TransitionUp }}
            >
              <AppBar className={classes.appBar} position="sticky">
                <Toolbar>
                  <IconButton color="inherit" onClick={this.handleTagsDialogClose} aria-label="Close">
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="h6" color="inherit" className={classes.flex}>
                    DICOM Tags
                  </Typography>
                </Toolbar>
              </AppBar>
              <TagsTable data={metaData} />
          </Dialog>
        </div>

        <div className="content">
          <div id="layerGroup0" className="layerGroup">
            <div id="dropBox"></div>
          </div>
        </div>

        <div className="footer">
          <p className="legend">
            <Typography variant="caption">Powered by <Link
                href="https://github.com/ivmartel/dwv"
                title="dwv on github"
                color="inherit">dwv
              </Link> {versions.dwv} and <Link
                href="https://github.com/facebook/react"
                title="react on github"
                color="inherit">React
              </Link> {versions.react}
            </Typography>
          </p>
        </div>

      </Root>
    );
  }

  componentDidMount() {
    // create app
    const app = new App();
    // initialise app
    app.init({
      "dataViewConfigs": {'*': [{divId: 'layerGroup0'}]},
      "tools": this.state.tools,
      overlayConfig
    });

    // load events
    let nLoadItem = null;
    let nReceivedLoadError = null;
    let nReceivedLoadAbort = null;
    let isFirstRender = null;
    app.addEventListener('loadstart', (/*event*/) => {
      // reset flags
      nLoadItem = 0;
      nReceivedLoadError = 0;
      nReceivedLoadAbort = 0;
      isFirstRender = true;
      // hide drop box
      this.showDropbox(app, false);
    });
    app.addEventListener("loadprogress", (event) => {
      this.setState({loadProgress: event.loaded});
    });
    app.addEventListener('renderend', (event) => {
      const {
        dwvApp,
        toolNames
      } = this.state;

      if (isFirstRender) {
        isFirstRender = false;
        const vl = dwvApp.getViewLayersByDataId(event.dataid)[0];
        const vc = vl.getViewController();
        // available tools
        if (toolNames.includes('Scroll') && vc.canScroll()) {
          this.setState({canScroll: true});
        }
        if (toolNames.includes('WindowLevel') && vc.isMonochrome()) {
          this.setState({canWindowLevel: true});
        }
        // selected tool
        let selectedTool = toolNames[0];
        if (selectedTool === 'Scroll' &&
          !vc.canScroll() &&
          toolNames.length > 0) {
          selectedTool = toolNames[1];
        }
        this.onChangeTool(selectedTool);

        // get window level presets
        if (toolNames.includes('WindowLevel')) {
          const presetNames = vc.getWindowLevelPresetsNames();
          this.setState({
            presetNames,
            selectedPreset: presetNames[0]
          });
        }
      }
    });
    app.addEventListener("load", (event) => {
      // set dicom tags
      this.setState({metaData: app.getMetaData(event.dataid)});
      // force progress
      this.setState({loadProgress: 100});
      // set data loaded flag
      this.setState({dataLoaded: true});
    });
    app.addEventListener('loadend', (/*event*/) => {
      if (nReceivedLoadError) {
        this.setState({loadProgress: 0});
        alert('Received errors during load. Check log for details.');
        // show drop box if nothing has been loaded
        if (!nLoadItem) {
          this.showDropbox(app, true);
        }
      }
      if (nReceivedLoadAbort) {
        this.setState({loadProgress: 0});
        alert('Load was aborted.');
        this.showDropbox(app, true);
      }
    });
    app.addEventListener('loaditem', (/*event*/) => {
      ++nLoadItem;
    });
    app.addEventListener('loaderror', (event) => {
      console.error(event.error);
      ++nReceivedLoadError;
    });
    app.addEventListener('loadabort', (/*event*/) => {
      ++nReceivedLoadAbort;
    });

    // handle key events
    app.addEventListener('keydown', (event) => {
      app.defaultOnKeydown(event);
    });
    // listen to 'wlchange'
    app.addEventListener('wlchange', (event) => {
      // value: [center, width, name]
      const manualStr = 'manual';
      if (event.value[2] === manualStr) {
        if (!this.state.presetNames.includes(manualStr)) {
          const newNames = this.state.presetNames.concat([manualStr]);
          this.setState({presetNames: newNames});
        }
        if (this.state.selectedPreset !== manualStr) {
          this.setState({selectedPreset: manualStr});
        }
      }
    });
    // handle window resize
    window.addEventListener('resize', app.onResize);

    // store
    this.setState({dwvApp: app});

    // setup drop box
    this.setupDropbox(app);

    // possible load from location
    app.loadFromUri(window.location.href);
  }

  /**
   * Get the icon of a tool.
   *
   * @param {string} tool The tool name.
   * @returns {Icon} The associated icon.
   */
  getToolIcon = (tool) => {
    let res;
    if (tool === 'Scroll') {
      res = (<MenuIcon />);
    } else if (tool === 'ZoomAndPan') {
      res = (<SearchIcon />);
    } else if (tool === 'WindowLevel') {
      res = (<ContrastIcon />);
    } else if (tool === 'Draw') {
      if (this.state.selectedShape === 'Ruler') {
        res = (<StraightenIcon />);
      } else if (this.state.selectedShape === 'Arrow') {
        res = (<CallMadeIcon />);
      } else if (this.state.selectedShape === 'Rectangle') {
        res = (<CropLandscapeIcon />);
      } else if (this.state.selectedShape === 'Circle') {
        res = (<RadioButtonUncheckedIcon />);
      } else if (this.state.selectedShape === 'Ellipse') {
        res = (<SportsRugbyIcon />);
      } else if (this.state.selectedShape === 'Protractor') {
        res = (<SquareFootIcon />);
      } else if (this.state.selectedShape === 'Roi') {
        res = (<PolylineIcon />);
      }
    }
    return res;
  }

  /**
   * Handle a change tool event.
   *
   * @param {string} tool The new tool name.
   */
  onChangeTool = (tool) => {
    this.setState({selectedTool: tool}, () => {
      this.applySelectedTool()
    });
  }

  /**
   * Apply the selected tool.
   */
  applySelectedTool = () => {
    if (this.state.dwvApp) {
      this.state.dwvApp.setTool(this.state.selectedTool);
      const lg = this.state.dwvApp.getActiveLayerGroup();
      if (this.state.selectedTool === 'Draw') {
        this.state.dwvApp.setToolFeatures({shapeName: this.state.selectedShape});
        // reuse created draw layer
        if (lg !== undefined && lg.getNumberOfLayers() > 1) {
          lg.setActiveLayer(1);
        }
      } else {
        // if draw was created, active is now a draw layer...
        // reset to view layer
        lg.setActiveLayer(0);
      }
    }
  }

  /**
   * Check if a tool can be run.
   *
   * @param {string} tool The tool name.
   * @returns {boolean} True if the tool can be run.
   */
  canRunTool = (tool) => {
    let res;
    if (tool === 'Scroll') {
      res = this.state.canScroll;
    } else if (tool === 'WindowLevel') {
      res = this.state.canWindowLevel;
    } else {
      res = true;
    }
    return res;
  }

  /**
   * Handle preset change.
   *
   * @param {string} name The name of the new preset.
   */
  onChangePreset(name) {
    this.setState({selectedPreset: name}, () => {
      this.applySelectedPreset();
    });
  };

  /**
   * Apply the selecte window level preset.
   */
  applySelectedPreset() {
    if (this.state.toolNames.includes('WindowLevel')) {
      const lg = this.state.dwvApp.getActiveLayerGroup();
      const vl = lg.getViewLayersFromActive()[0];
      const vc = vl.getViewController();
      vc.setWindowLevelPreset(this.state.selectedPreset);
    }
  };

  /**
   * Handle a change draw shape event.
   *
   * @param {string} name The name of the new shape.
   */
  onChangeShape = (name) => {
    this.setState({selectedShape: name}, () => {
      this.applySelectedShape();
    });
  }

  /**
   * Apply the selected draw shape.
   */
  applySelectedShape = () => {
    this.onChangeTool('Draw');
  }

  /**
   * Toogle the viewer orientation.
   */
  toggleOrientation = () => {
    if (typeof this.state.orientation !== 'undefined') {
      if (this.state.orientation === 'axial') {
        this.state.orientation = 'coronal';
      } else if (this.state.orientation === 'coronal') {
        this.state.orientation = 'sagittal';
      } else if (this.state.orientation === 'sagittal') {
        this.state.orientation = 'axial';
      }
    } else {
      // default is most probably axial
      this.state.orientation = 'coronal';
    }
    // update data view config
    const config = {
      '*': [
        {
          divId: 'layerGroup0',
          orientation: this.state.orientation
        }
      ]
    };
    this.state.dwvApp.setDataViewConfigs(config);
    // render data
    const dataIds = this.state.dwvApp.getDataIds();
    for (const dataId of dataIds) {
      this.state.dwvApp.render(dataId);
    }
  }

  /**
   * Handle a reset event.
   */
  onReset = () => {
    if (this.state.dwvApp) {
      this.state.dwvApp.resetLayout();
    }
  }

  /**
   * Open the DICOM tags dialog.
   */
  handleTagsDialogOpen = () => {
    this.setState({ showDicomTags: true });
  }

  /**
   * Close the DICOM tags dialog.
   */
  handleTagsDialogClose = () => {
    this.setState({ showDicomTags: false });
  };

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Setup the data load drop box: add event listeners and set initial size.
   */
  setupDropbox = (app) => {
    this.showDropbox(app, true);
  }

  /**
   * Default drag event handling.
   * @param {DragEvent} event The event to handle.
   */
  defaultHandleDragEvent = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param {DragEvent} event The event to handle.
   */
  onBoxDragOver = (event) => {
    this.defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) === -1) {
        box.className += ' ' + this.state.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param {DragEvent} event The event to handle.
   */
  onBoxDragLeave = (event) => {
    this.defaultHandleDragEvent(event);
    // update box class
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.state.hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param {DragEvent} event The event to handle.
   */
  onDrop = (event) => {
    this.defaultHandleDragEvent(event);
    // load files
    this.state.dwvApp.loadFiles(event.dataTransfer.files);
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  onInputFile = (event) => {
    if (event.target && event.target.files) {
      this.state.dwvApp.loadFiles(event.target.files);
    }
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  showDropbox = (app, show) => {
    const box = document.getElementById(this.state.dropboxDivId);
    if (!box) {
      return;
    }
    const layerDiv = document.getElementById('layerGroup0');

    if (show) {
      // reset css class
      box.className = this.state.dropboxClassName + ' ' + this.state.borderClassName;
      // check content
      if (box.innerHTML === '') {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Drag and drop data here or '));
        // input file
        const input = document.createElement('input');
        input.onchange = this.onInputFile;
        input.type = 'file';
        input.multiple = true;
        input.id = 'input-file';
        input.style.display = 'none';
        const label = document.createElement('label');
        label.htmlFor = 'input-file';
        const link = document.createElement('a');
        link.appendChild(document.createTextNode('click here'));
        link.id = 'input-file-link';
        label.appendChild(link);
        p.appendChild(input);
        p.appendChild(label);

        box.appendChild(p);
      }
      // show box
      box.setAttribute('style', 'display:initial');
      // stop layer listening
      if (layerDiv) {
        layerDiv.removeEventListener('dragover', this.defaultHandleDragEvent);
        layerDiv.removeEventListener('dragleave', this.defaultHandleDragEvent);
        layerDiv.removeEventListener('drop', this.onDrop);
      }
      // listen to box events
      box.addEventListener('dragover', this.onBoxDragOver);
      box.addEventListener('dragleave', this.onBoxDragLeave);
      box.addEventListener('drop', this.onDrop);
    } else {
      // remove border css class
      box.className = this.state.dropboxClassName;
      // remove content
      box.innerHTML = '';
      // hide box
      box.setAttribute('style', 'display:none');
      // stop box listening
      box.removeEventListener('dragover', this.onBoxDragOver);
      box.removeEventListener('dragleave', this.onBoxDragLeave);
      box.removeEventListener('drop', this.onDrop);
      // listen to layer events
      if (layerDiv) {
        layerDiv.addEventListener('dragover', this.defaultHandleDragEvent);
        layerDiv.addEventListener('dragleave', this.defaultHandleDragEvent);
        layerDiv.addEventListener('drop', this.onDrop);
      }
    }
  }

  // drag and drop [end] -------------------------------------------------------

} // DwvComponent

export default (DwvComponent);
