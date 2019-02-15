import React from 'react';
import './DwvComponent.css';
import dwv from 'dwv';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import TagsTable from './TagsTable';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';



// decode query
dwv.utils.decodeQuery = dwv.utils.base.decodeQuery;
// progress
dwv.gui.displayProgress = function () {};
// get element
dwv.gui.getElement = dwv.gui.base.getElement;
// refresh element
dwv.gui.refreshElement = dwv.gui.base.refreshElement;

// dwv.gui.FileLoad = dwv.gui.base.FileLoad;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "assets/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "assets/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "assets/dwv/decoders/pdfjs/decode-jpegbaseline.js"
};

const styles = theme => ({
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
    
  });

class DwvComponentModified extends React.Component{
    constructor(props){
        super(props);
        this.state={
            tools: ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'],
            loadProgress: 0,
            dataLoaded: false,
            dwvApp: null,
            tags: [],
            showDicomTags: false,
        };
    }
    render() {
        return (
            <div id="dwv">
                <button disabled={!this.state.dataLoaded} onClick={this.onReset}>Reset</button>
                <button onClick={this.loadFromURL}>LoadImage</button>
                <button disabled={!this.state.dataLoaded} onClick={this.handleTagsDialogOpen}>Tags</button>
                <Dialog open={this.state.showDicomTags}
                    onClose={this.handleTagsDialogClose}
                >
                    <AppBar >
                        <Toolbar>
                        <IconButton color="inherit" onClick={this.handleTagsDialogClose} aria-label="Close">
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="title" color="inherit">
                            DICOM Tags
                        </Typography>
                        </Toolbar>
                    </AppBar>
                    <TagsTable data={this.state.tags} ></TagsTable>
                    </Dialog>
                <div className="layerContainer">
                    <div className="dropBox">Drag and drop data here.</div>
                    <canvas className="imageLayer">Only for HTML5 compatible browsers...</canvas>
                    <div className="drawDiv"></div>
                </div>
            </div>
        );
    }
    
    componentDidMount(){
        var dcmApp = new dwv.App()
        dcmApp.init({
            "containerDivId":"dwv",
            "tools": this.state.tools,
            "shapes": ["Ruler","FreeHand", "Protractor", "Rectangle", "Roi", "Ellipse", "Arrow"],
            "isMobile": true
        })
        var self = this;
        // dcmApp.addEventListener("load-progress", function (event) {
        //     self.setState({loadProgress: event.loaded});
        //   });
          dcmApp.addEventListener("load-end", function (event) {
            // set data loaded flag
            self.setState({dataLoaded: true});
            // set dicom tags
            self.setState({tags: dcmApp.getTags()});
            // set the selected tool
            if (dcmApp.isMonoSliceData() && dcmApp.getImage().getNumberOfFrames() === 1) {
              self.setState({selectedTool: 'ZoomAndPan'});
            } else {
              self.setState({selectedTool: 'Scroll'});
            }
          });
          // store
          this.setState({dwvApp: dcmApp});
    }

    onChangeTool = tool => {
        if ( this.state.dwvApp ) {
          this.setState({selectedTool: tool});
          this.state.dwvApp.onChangeTool({currentTarget: { value: tool } });
        }
      }
      
      onReset = tool => {
        if ( this.state.dwvApp ) {
            this.state.dwvApp.onDisplayReset();
            }
      }
    
      handleTagsDialogOpen = () => {
        this.setState({ showDicomTags: true });
      }
    
      handleTagsDialogClose = () => {
        this.setState({ showDicomTags: false });
      }

      loadFromURL = (e, urlsArray = null) => {
        this.state.dwvApp.loadURLs(urlsArray ? urlsArray : ['https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323851.dcm']);
      }
};



export default DwvComponentModified;