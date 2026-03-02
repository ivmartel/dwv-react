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

import { DwvService } from './dwv.service.js';
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

    const dwvService = new DwvService();
    const shapeNames = dwvService.getShapeNames();

    this.state = {
      dwvService,
      versions: {
        dwv: dwvService.getDwvVersion(),
        react: version
      },
      toolNames: dwvService.getToolNames(),
      shapeNames,
      presetNames: [],
      selectedTool: '',
      selectedShape: shapeNames[0],
      selectedPreset: '',
      loadProgress: 0,
      dataLoaded: false,
      metaData: undefined,
      showDicomTags: false,
      dropboxDivId: 'dropBox',
      dropboxClassName: 'dropBox',
      borderClassName: 'dropBoxBorder',
      hoverClassName: 'hover'
    };

    // watch load progress
    dwvService.addEventListener('loadprogress', (event) => {
      this.setState({loadProgress: event.detail.value}, () => {
        this.autoShowDropbox();
      });
    });
    // watch data ready
    dwvService.addEventListener('dataready', (event) => {
      const dataReady = event.detail.value;
      if (dataReady) {
        const runnableTool = this.state.dwvService.getFirstRunnableTool();
        if (runnableTool !== undefined) {
          this.setState({selectedTool: runnableTool});
          this.applyTool(runnableTool);
        }
      }
    });
    // watch data loaded
    dwvService.addEventListener('dataloaded', (event) => {
      this.setState({dataLoaded: event.detail.value}, () => {
        this.setState({metaData: this.state.dwvService.getMetaData()});
        this.autoShowDropbox();
      });
    });
    // watch preset names
    dwvService.addEventListener('presetnames', (event) => {
      this.setState({presetNames: event.detail.value}, () => {
        const presetNames = this.state.presetNames;
        this.setState({selectedPreset: presetNames[0]});
      });
    });
    // watch is manual preset
    dwvService.addEventListener('ismanualpreset', (event) => {
      const isManual = event.detail.value;
      const preset = this.state.selectedPreset;
      const manualStr = 'manual';
      if (isManual && preset !== manualStr) {
        this.setState({selectedPreset: manualStr});
      }
    });
  }

  render() {
    const {
      versions,
      toolNames,
      selectedTool,
      loadProgress,
      dataLoaded,
      metaData,
      presetNames,
      selectedPreset,
      shapeNames,
      selectedShape
    } = this.state;

    const toolsButtons = toolNames.map( (tool) => {
      let res = [
        <div key="{{ tool }}-item" className="toolbar-item">
          <Button
            value={tool}
            key={tool}
            title={tool}
            sx={{padding: "6px", minWidth: "20px"}}
            variant={tool === selectedTool? "outlined" : "contained"}
            disabled={!dataLoaded || !this.canRunTool(tool)}
            onClick={this.onChangeTool}>
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
              onChange={this.onChangePreset}>
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
              onChange={this.onChangeShape}>
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
              onClick={this.onReset}
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
    // setup drop box
    this.setupDropbox();

    // possible load from location
    this.state.dwvService.loadFromUri(window.location.href);
  }

  /**
   * Get the icon of a tool.
   *
   * @param {string} tool The tool name.
   * @returns {Icon} The associated icon.
   */
  getToolIcon(tool) {
    let res;
    if (tool === 'Scroll') {
      res = (<MenuIcon />);
    } else if (tool === 'ZoomAndPan') {
      res = (<SearchIcon />);
    } else if (tool === 'WindowLevel') {
      res = (<ContrastIcon />);
    } else if (tool === 'Draw') {
      res = this.getShapeIcon(this.state.selectedShape);
    }
    return res;
  }

  /**
   * Get the icon of a shape.
   *
   * @param {string} shape The shape name.
   * @returns {Icon} The associated icon string.
   */
  getShapeIcon(shape) {
    let res;
    if (shape === 'Ruler') {
      res = (<StraightenIcon />);
    } else if (shape === 'Arrow') {
      res = (<CallMadeIcon />);
    } else if (shape === 'Rectangle') {
      res = (<CropLandscapeIcon />);
    } else if (shape === 'Circle') {
      res = (<RadioButtonUncheckedIcon />);
    } else if (shape === 'Ellipse') {
      res = (<SportsRugbyIcon />);
    } else if (shape === 'Protractor') {
      res = (<SquareFootIcon />);
    } else if (shape === 'Roi') {
      res = (<PolylineIcon />);
    }
    return res;
  }

  /**
   * Handle a change tool event.
   *
   * @param {event} event The change event.
   */
  onChangeTool = (event) => {
    const tool = event.currentTarget.value;
    this.setState({selectedTool: tool}, () => {
      this.applyTool(tool);
    });
  }

  /**
   * Handle a shape change event.
   *
   * @param {Event} event The change event.
   */
  onChangeShape = (event) => {
    const shape = event.currentTarget.value;
    this.setState({selectedShape: shape}, () => {
      this.setState({selectedTool: 'Draw'});
      this.applyShape(shape);
    });
  }

  /**
   * Handle a preset change event.
   *
   * @param {Event} event The change event.
   */
  onChangePreset = (event) => {
    const preset = event.currentTarget.value;
    this.setState({selectedPreset: preset}, () => {
      this.applyPreset(preset);
    });
  };

  /**
   * Apply a tool.
   *
   * @param {string} tool The tool name.
   * @param {object} [features] Optional tool features.
   */
  applyTool(tool, features) {
    if (typeof features === 'undefined' && tool === 'Draw') {
      features = {shapeName: this.state.selectedShape};
    }
    this.state.dwvService.applyTool(tool, features);
  }

  /**
   * Apply a draw shape.
   *
   * @param {string} shape The shape name.
   */
  applyShape(shape) {
    this.applyTool('Draw', {shapeName: shape});
  }

  /**
   * Apply a window level preset.
   *
   * @param {string} preset The preset name.
   */
  applyPreset(preset) {
    this.state.dwvService.applyPreset(preset);
  }

  /**
   * Check if a tool can be run.
   *
   * @param {string} tool The tool name.
   * @returns {boolean} True if the tool can be run.
   */
  canRunTool(tool) {
    return this.state.dwvService.canRunTool(tool);
  }

  /**
   * Toogle the viewer orientation.
   */
  toggleOrientation = () => {
    this.state.dwvService.toggleOrientation();
  }

  /**
   * Handle a reset event.
   */
  onReset = () => {
    this.state.dwvService.reset();
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
  setupDropbox() {
    this.showDropbox(true);
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
    this.state.dwvService.loadFiles(event.dataTransfer.files);
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  onInputFile = (event) => {
    if (event.target && event.target.files) {
      this.state.dwvService.loadFiles(event.target.files);
    }
  }

  /**
   * Show the dropbox according to state.
   */
  autoShowDropbox() {
    const isLoaded = this.state.dataLoaded;
    const progress = this.state.loadProgress;
    const isLoading = progress !== 0 && progress !== 100;
    this.showDropbox(!isLoading && !isLoaded);
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  showDropbox(show) {
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
