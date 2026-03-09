import {
  version,
  forwardRef,
  useState,
  useEffect,
  useRef
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

import { useDwvService } from './DwvServiceProvider.jsx';
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

const DwvComponent = () => {

  const dwvService = useDwvService();

  const [loadProgress, setLoadProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toolNames] = useState(dwvService.getToolNames());
  const [shapeNames] = useState(dwvService.getShapeNames());
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedShape, setSelectedShape] = useState(shapeNames[0]);
  const [presetNames, setPresetNames] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [metaData, setMetaData] = useState(undefined);
  const [showDicomTags, setShowDicomTags] = useState(false);

  const hasInitialized = useRef(false);

  const versions = {
    dwv: dwvService.getDwvVersion(),
    react: version
  };

  const dropboxDivId = 'dropBox';
  const dropboxClassName = 'dropBox';
  const borderClassName = 'dropBoxBorder';
  const hoverClassName = 'hover';

  useEffect(() => {
    // possible load from location
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dwvService.loadFromUri(window.location.href);
    }

    const handleLoadProgress = (event) => {
      const progress = event.detail.value;
      setLoadProgress(progress);
      autoShowDropbox(dataLoaded, progress);
    };
    const handleDataReady = (event) => {
      const dataReady = event.detail.value;
      if (dataReady) {
        const runnableTool = dwvService.getFirstRunnableTool();
        if (runnableTool !== undefined) {
          setSelectedTool(runnableTool);
          applyTool(runnableTool);
        }
      }
    };
    const handleDataLoaded = (event) => {
      const isLoaded = event.detail.value;
      setDataLoaded(isLoaded);
      setMetaData(dwvService.getMetaData());
      autoShowDropbox(isLoaded, loadProgress);
    };
    const handlePresetNames = (event) => {
      setPresetNames(event.detail.value);
      setSelectedPreset(event.detail.value[0]);
    };
    const handleIsManualPreset = (event) => {
      const isManual = event.detail.value;
      const preset = selectedPreset;
      const manualStr = 'manual';
      if (isManual && preset !== manualStr) {
        setSelectedPreset(manualStr);
      }
    };

    // subscribe
    dwvService.addEventListener('loadprogress', handleLoadProgress);
    dwvService.addEventListener('dataready', handleDataReady);
    dwvService.addEventListener('dataloaded', handleDataLoaded);
    dwvService.addEventListener('presetnames', handlePresetNames);
    dwvService.addEventListener('ismanualpreset', handleIsManualPreset);

    // cleanup
    return () => {
      dwvService.removeEventListener('loadprogress', handleLoadProgress);
      dwvService.removeEventListener('dataready', handleDataReady);
      dwvService.removeEventListener('dataloaded', handleDataLoaded);
      dwvService.removeEventListener('presetnames', handlePresetNames);
      dwvService.removeEventListener('ismanualpreset', handleIsManualPreset);
    };
  }, [dwvService]);

  /**
   * Get the icon of a tool.
   *
   * @param {string} tool The tool name.
   * @returns {Icon} The associated icon.
   */
  const getToolIcon = (tool) => {
    let res;
    if (tool === 'Scroll') {
      res = (<MenuIcon />);
    } else if (tool === 'ZoomAndPan') {
      res = (<SearchIcon />);
    } else if (tool === 'WindowLevel') {
      res = (<ContrastIcon />);
    } else if (tool === 'Draw') {
      res = getShapeIcon(selectedShape);
    }
    return res;
  }

  /**
   * Get the icon of a shape.
   *
   * @param {string} shape The shape name.
   * @returns {Icon} The associated icon string.
   */
  const getShapeIcon = (shape) => {
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
  const onChangeTool = (event) => {
    const tool = event.currentTarget.value;
    setSelectedTool(tool);
    applyTool(tool);
  }

  /**
   * Handle a shape change event.
   *
   * @param {Event} event The change event.
   */
  const onChangeShape = (event) => {
    const shape = event.currentTarget.value;
    setSelectedShape(shape);
    setSelectedTool('Draw');
    applyShape(shape);
  }

  /**
   * Handle a preset change event.
   *
   * @param {Event} event The change event.
   */
  const onChangePreset = (event) => {
    const preset = event.currentTarget.value;
    setSelectedPreset(preset);
    applyPreset(preset);
  };

  /**
   * Apply a tool.
   *
   * @param {string} tool The tool name.
   * @param {object} [features] Optional tool features.
   */
  const applyTool = (tool, features) => {
    if (typeof features === 'undefined' && tool === 'Draw') {
      features = {shapeName: selectedShape};
    }
    dwvService.applyTool(tool, features);
  }

  /**
   * Apply a draw shape.
   *
   * @param {string} shape The shape name.
   */
  const applyShape = (shape) => {
    applyTool('Draw', {shapeName: shape});
  }

  /**
   * Apply a window level preset.
   *
   * @param {string} preset The preset name.
   */
  const applyPreset = (preset) => {
    dwvService.applyPreset(preset);
  }

  /**
   * Check if a tool can be run.
   *
   * @param {string} tool The tool name.
   * @returns {boolean} True if the tool can be run.
   */
  const canRunTool = (tool) => {
    return dwvService.canRunTool(tool);
  }

  /**
   * Toogle the viewer orientation.
   */
  const toggleOrientation = () => {
    dwvService.toggleOrientation();
  }

  /**
   * Handle a reset event.
   */
  const onReset = () => {
    dwvService.reset();
  }

  /**
   * Open the DICOM tags dialog.
   */
  const handleTagsDialogOpen = () => {
    setShowDicomTags(true);
  }

  /**
   * Close the DICOM tags dialog.
   */
  const handleTagsDialogClose = () => {
    setShowDicomTags(false);
  };

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Default drag event handling.
   * @param {DragEvent} event The event to handle.
   */
  const defaultHandleDragEvent = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragOver = (event) => {
    defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(dropboxDivId);
    if (box && box.className.indexOf(hoverClassName) === -1) {
        box.className += ' ' + hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragLeave = (event) => {
    defaultHandleDragEvent(event);
    // update box class
    const box = document.getElementById(dropboxDivId);
    if (box && box.className.indexOf(hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param {DragEvent} event The event to handle.
   */
  const onDrop = (event) => {
    defaultHandleDragEvent(event);
    // load files
    dwvService.loadFiles(event.dataTransfer.files);
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  const onInputFile = (event) => {
    if (event.target && event.target.files) {
      dwvService.loadFiles(event.target.files);
    }
  }

  /**
   * Show the dropbox according to state.
   */
  const autoShowDropbox = (isLoaded, progress) => {
    const isLoading = progress !== 0 && progress !== 100;
    showDropbox(!isLoading && !isLoaded);
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  const showDropbox = (show) => {
    const box = document.getElementById(dropboxDivId);
    if (!box) {
      return;
    }
    const layerDiv = document.getElementById('layerGroup0');

    if (show) {
      // reset css class
      box.className = dropboxClassName + ' ' + borderClassName;
      // show box
      box.setAttribute('style', 'display:initial');
      // stop layer listening
      if (layerDiv) {
        layerDiv.removeEventListener('dragover', defaultHandleDragEvent);
        layerDiv.removeEventListener('dragleave', defaultHandleDragEvent);
        layerDiv.removeEventListener('drop', onDrop);
      }
      // listen to box events
      box.addEventListener('dragover', onBoxDragOver);
      box.addEventListener('dragleave', onBoxDragLeave);
      box.addEventListener('drop', onDrop);
    } else {
      // remove border css class
      box.className = dropboxClassName;
      // hide box
      box.setAttribute('style', 'display:none');
      // stop box listening
      box.removeEventListener('dragover', onBoxDragOver);
      box.removeEventListener('dragleave', onBoxDragLeave);
      box.removeEventListener('drop', onDrop);
      // listen to layer events
      if (layerDiv) {
        layerDiv.addEventListener('dragover', defaultHandleDragEvent);
        layerDiv.addEventListener('dragleave', defaultHandleDragEvent);
        layerDiv.addEventListener('drop', onDrop);
      }
    }
  }

  // drag and drop [end] -------------------------------------------------------

  const getToolsButtons = () => {

    const toolsButtons = toolNames.map( (tool) => {
      let res = [
        <div key="{{ tool }}-item" className="toolbar-item">
          <Button
            value={tool}
            key={tool}
            title={tool}
            sx={{padding: "6px", minWidth: "20px"}}
            variant={tool === selectedTool? "outlined" : "contained"}
            disabled={!dataLoaded || !canRunTool(tool)}
            onClick={onChangeTool}>
            { getToolIcon(tool) }
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
              disabled={!dataLoaded || !canRunTool(tool)}>
              <KeyboardArrowDownIcon />
            </Button>
            <select
              key="WindowLevelPresetsSelect"
              value={selectedPreset}
              onChange={onChangePreset}>
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
              disabled={!dataLoaded || !canRunTool(tool)}>
              <KeyboardArrowDownIcon />
            </Button>
            <select
              key="DrawShapeSelect"
              value={selectedShape}
              onChange={onChangeShape}>
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

    return toolsButtons;
  }

  return (
    <Root className={classes.root} id="dwv">
      <LinearProgress variant="determinate" value={loadProgress} />
      <div className="header">

        {getToolsButtons()}

        <div key="reset-item" className="toolbar-item">
          <Button
            value="reset"
            title="Reset"
            variant="contained"
            sx={{padding: "6px", minWidth: "20px"}}
            disabled={!dataLoaded}
            onClick={onReset}
          ><RefreshIcon /></Button>
        </div>

        <div key="orient-item" className="toolbar-item">
          <Button
            value="toggleOrientation"
            title="Toggle Orientation"
            variant="contained"
            sx={{padding: "6px", minWidth: "20px"}}
            disabled={!dataLoaded}
            onClick={toggleOrientation}
          ><CameraswitchIcon /></Button>
        </div>

        <div key="tags-item" className="toolbar-item">
          <Button
            value="tags"
            title="Tags"
            variant="contained"
            sx={{padding: "6px", minWidth: "20px"}}
            disabled={!dataLoaded}
            onClick={handleTagsDialogOpen}
          ><LibraryBooksIcon /></Button>
        </div>

        <Dialog
          open={showDicomTags}
          onClose={handleTagsDialogClose}
          slots={{ transition: TransitionUp }}
          >
            <AppBar className={classes.appBar} position="sticky">
              <Toolbar>
                <IconButton color="inherit" onClick={handleTagsDialogClose} aria-label="Close">
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
          <div id="dropBox"
            className="dropBox dropBoxBorder"
            onDragOver={onBoxDragOver}
            onDragLeave={onBoxDragLeave}
            onDrop={onDrop}
            >
            <p>Drag and drop data here or
              <label htmlFor="input-file">
                <a id="input-file-link"> click here</a>
                <input
                  id="input-file"
                  type="file"
                  multiple
                  onChange={onInputFile}
                  style={{display: "none"}}/>
              </label>
            </p>
          </div>
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

} // DwvComponent

export default (DwvComponent);
