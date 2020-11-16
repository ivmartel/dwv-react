import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Link from '@material-ui/core/Link';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Slide from '@material-ui/core/Slide';
import Toolbar from '@material-ui/core/Toolbar';

import TagsTable from './TagsTable';

import './DwvComponent.css';
import dwv from 'dwv';

// gui overrides

// get element
dwv.gui.getElement = dwv.gui.base.getElement;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "assets/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "assets/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "assets/dwv/decoders/pdfjs/decode-jpegbaseline.js",
    "rle": "assets/dwv/decoders/dwv/decode-rle.js"
};

const styles = theme => ({
  button: {
    margin: theme.spacing(1),
  },
  appBar: {
    position: 'relative',
  },
  title: {
    flex: '0 0 auto',
  },
  tagsDialog: {
    minHeight: '90vh', maxHeight: '90vh',
    minWidth: '90vw', maxWidth: '90vw',
  },
  iconSmall: {
    fontSize: 20,
  }
});

export const TransitionUp = React.forwardRef((props, ref) => (
  <Slide direction="up" {...props} ref={ref} />
))

class DwvComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      versions: {
        dwv: dwv.getVersion(),
        react: React.version
      },
      tools: {
        Scroll: {},
        ZoomAndPan: {},
        WindowLevel: {},
        Draw: {
          options: ['Ruler'],
          type: 'factory',
          events: ['draw-create', 'draw-change', 'draw-move', 'draw-delete']
        }
      },
      selectedTool: 'Select Tool',
      loadProgress: 0,
      dataLoaded: false,
      dwvApp: null,
      metaData: [],
      showDicomTags: false,
      toolMenuAnchorEl: null,
      dropboxClassName: 'dropBox',
      borderClassName: 'dropBoxBorder',
      hoverClassName: 'hover'
    };
  }

  render() {
    const { classes } = this.props;
    const { versions, tools, loadProgress, dataLoaded, metaData, toolMenuAnchorEl } = this.state;

    const toolsMenuItems = Object.keys(tools).map( (tool) =>
      <MenuItem onClick={this.handleMenuItemClick.bind(this, tool)} key={tool} value={tool}>{tool}</MenuItem>
    );

    return (
      <div id="dwv">
        <LinearProgress variant="determinate" value={loadProgress} />
        <div className="button-row">
          <Button variant="contained" color="primary"
            aria-owns={toolMenuAnchorEl ? 'simple-menu' : null}
            aria-haspopup="true"
            onClick={this.handleMenuButtonClick}
            disabled={!dataLoaded}
            className={classes.button}
            size="medium"
          >{ this.state.selectedTool }
          <ArrowDropDownIcon className={classes.iconSmall}/></Button>
          <Menu
            id="simple-menu"
            anchorEl={toolMenuAnchorEl}
            open={Boolean(toolMenuAnchorEl)}
            onClose={this.handleMenuClose}
          >
            {toolsMenuItems}
          </Menu>

          <Button variant="contained" color="primary"
            disabled={!dataLoaded}
            onClick={this.onReset}
          >Reset</Button>

          <Button variant="contained" color="primary"
            onClick={this.handleTagsDialogOpen}
            disabled={!dataLoaded}
            className={classes.button}
            size="medium">Tags</Button>
          <Dialog
            open={this.state.showDicomTags}
            onClose={this.handleTagsDialogClose}
            TransitionComponent={TransitionUp}
            classes={{ paper: classes.tagsDialog }}
            >
              <AppBar className={classes.appBar}>
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

        <div className="layerContainer">
          <div className="dropBox"></div>
          <canvas className="imageLayer">Only for HTML5 compatible browsers...</canvas>
          <div className="drawDiv"></div>
        </div>

        <div><p className="legend">
          <Typography variant="caption">Powered by <Link
              href="https://github.com/ivmartel/dwv"
              title="dwv on github">dwv
            </Link> {versions.dwv} and React {versions.react}
          </Typography>
        </p></div>

      </div>
    );
  }

  componentDidMount() {
    // create app
    var app = new dwv.App();
    // initialise app
    app.init({
      "containerDivId": "dwv",
      "tools": this.state.tools
    });

    // load events
    let nLoadItem = null;
    let nReceivedError = null;
    let nReceivedAbort = null;
    app.addEventListener('load-start', (/*event*/) => {
      // reset flags
      nLoadItem = 0;
      nReceivedError = 0;
      nReceivedAbort = 0;
      // hide drop box
      this.showDropbox(app, false);
    });
    app.addEventListener("load-progress", (event) => {
      this.setState({loadProgress: event.loaded});
    });
    app.addEventListener("load", (/*event*/) => {
      // set dicom tags
      this.setState({metaData: dwv.utils.objectToArray(app.getMetaData())});
      // set the selected tool
      let selectedTool = 'Scroll'
      if (app.isMonoSliceData() && app.getImage().getNumberOfFrames() === 1) {
        selectedTool = 'ZoomAndPan';
      }
      this.onChangeTool(selectedTool);
      // set data loaded flag
      this.setState({dataLoaded: true});
    });
    app.addEventListener('load-end', (/*event*/) => {
      if (nReceivedError) {
        this.setState({loadProgress: 0});
        alert('Received errors during load. Check log for details.');
        // show drop box if nothing has been loaded
        if (!nLoadItem) {
          this.showDropbox(app, true);
        }
      }
      if (nReceivedAbort) {
        this.setState({loadProgress: 0});
        alert('Load was aborted.');
        this.showDropbox(app, true);
      }
    });
    app.addEventListener('load-item', (/*event*/) => {
      ++nLoadItem;
    });
    app.addEventListener('error', (event) => {
      console.error(event.error);
      ++nReceivedError;
    });
    app.addEventListener('abort', (/*event*/) => {
      ++nReceivedAbort;
    });

    // handle key events
    app.addEventListener('keydown', (event) => {
      app.defaultOnKeydown(event);
    });
    // handle window resize
    window.addEventListener('resize', app.onResize);

    // store
    this.setState({dwvApp: app});

    // setup drop box
    this.setupDropbox(app);

    // possible load from location
    dwv.utils.loadFromUri(window.location.href, app);
  }

  /**
   * Handle a change tool event.
   * @param tool The new tool name.
   */
  onChangeTool = (tool: string) => {
    if (this.state.dwvApp) {
      this.setState({selectedTool: tool});
      this.state.dwvApp.setTool(tool);
      if (tool === 'Draw') {
        this.onChangeShape(this.state.tools.Draw.options[0]);
      }
    }
  }

  /**
   * Handle a change draw shape event.
   * @param shape The new shape name.
   */
  onChangeShape = (shape: string) => {
    if (this.state.dwvApp) {
      this.state.dwvApp.setDrawShape(shape);
    }
  }

  /**
   * Handle a reset event.
   */
  onReset = tool => {
    if (this.state.dwvApp) {
      this.state.dwvApp.resetDisplay();
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

  /**
   * Menu button click.
   */
  handleMenuButtonClick = event => {
    this.setState({ toolMenuAnchorEl: event.currentTarget });
  };

  /**
   * Menu cloase.
   */
  handleMenuClose = event => {
    this.setState({ toolMenuAnchorEl: null });
  };

  /**
   * Menu item click.
   */
  handleMenuItemClick = tool => {
    this.setState({ toolMenuAnchorEl: null });
    this.onChangeTool(tool);
  };

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Setup the data load drop box: add event listeners and set initial size.
   */
  setupDropbox = (app) => {
      // start listening to drag events on the layer container
      const layerContainer = app.getElement('layerContainer');
      if (layerContainer) {
        // show drop box
        this.showDropbox(app, true);
        // start listening to drag events on the layer container
        layerContainer.addEventListener('dragover', this.onDragOver);
        layerContainer.addEventListener('dragleave', this.onDragLeave);
        layerContainer.addEventListener('drop', this.onDrop);
      }
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  onDragOver = (event: DragEvent) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // update box border
    const box = this.state.dwvApp.getElement(this.state.borderClassName);
    if (box && box.className.indexOf(this.state.hoverClassName) === -1) {
        box.className += ' ' + this.state.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param event The event to handle.
   */
  onDragLeave = (event: DragEvent) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // update box class
    const box = this.state.dwvApp.getElement(this.borderClassName + ' hover');
    if (box && box.className.indexOf(this.state.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.state.hoverClassName, '');
    }
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  showDropbox = (app, show) => {
    const box = app.getElement(this.state.dropboxClassName);
    if (box) {
      if (show) {
        // reset css class
        box.className = this.state.dropboxClassName + ' ' + this.state.borderClassName;
        // check content
        if (box.innerHTML === '') {
          box.innerHTML = 'Drag and drop data here.';
        }
        const size = app.getLayerContainerSize();
        // set the initial drop box size
        const dropBoxSize = 2 * size.height / 3;
        box.setAttribute(
          'style',
          'width:' + dropBoxSize + 'px;height:' + dropBoxSize + 'px');
      } else {
        // remove border css class
        box.className = this.state.dropboxClassName;
        // remove content
        box.innerHTML = '';
        // make not visible
        box.setAttribute(
          'style',
          'visible:false;');
      }
    }
  }

  /**
   * Handle a drop event.
   * @param event The event to handle.
   */
  onDrop = (event: DragEvent) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
    // load files
    this.state.dwvApp.loadFiles(event.dataTransfer.files);
  }

  // drag and drop [end] -------------------------------------------------------

} // DwvComponent

DwvComponent.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DwvComponent);
