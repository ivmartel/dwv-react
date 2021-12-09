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

// Image decoders (for web workers)
dwv.image.decoderScripts = {
  "jpeg2000": `${process.env.PUBLIC_URL}/assets/dwv/decoders/pdfjs/decode-jpeg2000.js`,
  "jpeg-lossless": `${process.env.PUBLIC_URL}/assets/dwv/decoders/rii-mango/decode-jpegloss.js`,
  "jpeg-baseline": `${process.env.PUBLIC_URL}/assets/dwv/decoders/pdfjs/decode-jpegbaseline.js`,
  "rle": `${process.env.PUBLIC_URL}/assets/dwv/decoders/dwv/decode-rle.js`
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
          events: ['drawcreate', 'drawchange', 'drawmove', 'drawdelete']
        }
      },
      toolNames: [],
      selectedTool: 'Select Tool',
      loadProgress: 0,
      dataLoaded: false,
      dwvApp: null,
      metaData: [],
      showDicomTags: false,
      toolMenuAnchorEl: null,
      dropboxDivId: 'dropBox',
      dropboxClassName: 'dropBox',
      borderClassName: 'dropBoxBorder',
      hoverClassName: 'hover'
    };
  }

  render() {
    const { classes } = this.props;
    const { versions, tools, toolNames, loadProgress, dataLoaded, metaData, toolMenuAnchorEl } = this.state;

    const toolsMenuItems = toolNames.map( (tool) =>
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

        <div id="dropBox"></div>

        <div id="layerGroup0" className="layerGroup"></div>

        <div><p className="legend">
          <Typography variant="caption">Powered by <Link
              href="https://github.com/ivmartel/dwv"
              title="dwv on github">dwv
            </Link> {versions.dwv} and <Link
              href="https://github.com/facebook/react"
              title="react on github">React
            </Link> {versions.react}
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
      "dataViewConfigs": {'*': [{divId: 'layerGroup0'}]},
      "tools": this.state.tools
    });

    // load events
    let nLoadItem = null;
    let nReceivedError = null;
    let nReceivedAbort = null;
    let isFirstRender = null;
    app.addEventListener('loadstart', (/*event*/) => {
      // reset flags
      nLoadItem = 0;
      nReceivedError = 0;
      nReceivedAbort = 0;
      isFirstRender = true;
      // hide drop box
      this.showDropbox(app, false);
    });
    app.addEventListener("loadprogress", (event) => {
      this.setState({loadProgress: event.loaded});
    });
    app.addEventListener('renderend', (/*event*/) => {
      if (isFirstRender) {
        isFirstRender = false;
        // available tools
        let names = [];
        for (const key in this.state.tools) {
          if ((key === 'Scroll' && app.canScroll()) ||
            (key === 'WindowLevel' && app.canWindowLevel()) ||
            (key !== 'Scroll' && key !== 'WindowLevel')) {
            names.push(key);
          }
        }
        this.setState({toolNames: names});
        this.onChangeTool(names[0]);
      }
    });
    app.addEventListener("load", (/*event*/) => {
      // set dicom tags
      this.setState({metaData: dwv.utils.objectToArray(app.getMetaData(0))});
      // set data loaded flag
      this.setState({dataLoaded: true});
    });
    app.addEventListener('loadend', (/*event*/) => {
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
    app.addEventListener('loaditem', (/*event*/) => {
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
    this.showDropbox(app, true);
  }

  /**
   * Default drag event handling.
   * @param event The event to handle.
   */
  defaultHandleDragEvent = (event: DragEvent) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param event The event to handle.
   */
  onBoxDragOver = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) === -1) {
        box.className += ' ' + this.state.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param event The event to handle.
   */
  onBoxDragLeave = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // update box class
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.state.hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param event The event to handle.
   */
  onDrop = (event: DragEvent) => {
    this.defaultHandleDragEvent(event);
    // load files
    this.state.dwvApp.loadFiles(event.dataTransfer.files);
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  showDropbox = (app, show) => {
    const box = document.getElementById(this.state.dropboxDivId);
    const isBoxShown = box && box.offsetHeight !== 0;
    const layerDiv = this.state.dwvApp?.getElement('layerContainer');

    if (box) {
      if (show && !isBoxShown) {
        // reset css class
        box.className = this.state.dropboxClassName + ' ' + this.state.borderClassName;
        // check content
        if (box.innerHTML === '') {
          const p = document.createElement('p');
          p.appendChild(document.createTextNode('Drag and drop data here'));
          box.appendChild(p);
        }
        // show box
        box.setAttribute('style', 'visible:true;width:50%;height:75%');
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
        box.setAttribute('style', 'visible:false;width:0;height:0');
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
  }

  // drag and drop [end] -------------------------------------------------------

} // DwvComponent

DwvComponent.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DwvComponent);
