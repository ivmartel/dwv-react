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

dwv.gui.Undo = dwv.gui.base.Undo;

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

class DwvComponent extends React.Component{
    constructor(props){
        super(props);
        this.state={
            tools: ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'],
            loadProgress: 0,
            dataLoaded: false,
            dwvApp: null,
            tags: [],
            url: '',
            selectedTool: 'ZoomAndPan',
            selectedShape: 'Ruler',
            showDicomTags: false,
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
        this.onStateSave= this.onStateSave.bind(this);
        this.onChangeTool = this.onChangeTool.bind(this);
        this.onChangeShape = this.onChangeShape.bind(this);
      }
    handleChange(event){
      this.setState({
        tools: this.state.tools,
        loadProgress: this.state.loadProgress,
        dataLoaded: this.state.dataLoaded,
        dwvApp: this.state.dwvApp,
        tags: this.state.tags,
        url: event.target.value,
        selectedTool: this.state.selectedTool,
        selectedShape: this.state.selectedShape,
        showDicomTags: this.state.showDicomTags
      })
    }
    render() {
      var background={
        backgroundColor: '#333333'
      }
      var imageLayerStyle = {
        height : '100%',
        backgroundColor : '#333333'
      }
      // const dummy = this.state.tools.map((item) => <input type="radio" value={item} name="tool" checked={this.state.selectedTool==item}>{item}</input>)
        return (
            <div id="dwv" className="uk-grid uk-grid-divider" style={imageLayerStyle}>
              <div className="uk-width-2-5">
                <div onChange={this.onChangeTool} hidden={!this.state.dataLoaded}>
                  <input className="uk-radio" type="radio" value="ZoomAndPan" name="tool" checked={this.state.selectedTool == 'ZoomAndPan'}/>Zoom and Pan
                  <input className="uk-radio" type="radio" value="Scroll" name="tool" checked={this.state.selectedTool == 'Scroll'}/>Scroll
                  <input className="uk-radio" type="radio" value="WindowLevel" name="tool" checked={this.state.selectedTool == 'WindowLevel'}/>WindowLevel
                  <input className="uk-radio" type="radio" value="Draw" name="tool" checked={this.state.selectedTool == 'Draw'}/>Draw
                </div>
                <div onChange={this.onChangeShape} hidden={this.state.selectedTool !== "Draw"}>
                  <label>Select a shape:</label>
                  <br/>
                  <input className="uk-radio" type="radio" value="Ruler" name="shape" checked={this.state.selectedShape == 'Ruler'}/>Ruler
                  <input className="uk-radio" type="radio" value="FreeHand" name="shape" />FreeHand 
                  <input className="uk-radio" type="radio" value="Protractor" name="shape" />Protractor
                  <input className="uk-radio" type="radio" value="Rectangle" name="shape" />Rectangle
                  <input className="uk-radio" type="radio" value="Roi" name="shape" />Roi
                  <input className="uk-radio" type="radio" value="Ellipse" name="shape" />Ellipse
                  <input className="uk-radio" type="radio" value="Arrow" name="shape" />Arrow
                </div>
                
                  <input className="uk-input" value={this.state.url} onChange={this.handleChange}/>
                  <br/>
                  <div className="uk-button-group">                 
                    <button className="uk-button uk-button-secondary" onClick={this.loadFromURL}>LoadImage</button>
                    <button className="uk-button uk-button-secondary" disabled={!this.state.dataLoaded} onClick={this.onReset}>Reset</button>
                    <button className="uk-button uk-button-secondary" disabled={!this.state.dataLoaded} onClick={this.handleTagsDialogOpen}>Tags</button>
                  </div>
                  {(this.state.dataLoaded) ? <a  className="uk-button uk-button-primary" className="download-state" onClick={this.onStateSave}>Save</a> : ''}
                  {(this.state.selectedTool=="Draw")?
                  <div><button onClick={this.handleUndo}>Undo</button><button onClick={this.handleRedo}>Redo</button></div>: ''}
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
                </div>
              <div className="uk-width-3-5 ">
                <div className="layerContainer">
                    <div className="dropBox" style={background}>Drag and drop data here.</div>
                    <canvas className="imageLayer" >Only for HTML5 compatible browsers...</canvas>
                    <div className="drawDiv" ></div>
                </div>
              </div>
              <div className="history" hidden></div>
            </div>
        );
    }
    
    componentDidMount(){
        var dcmApp = new dwv.App()
        dcmApp.init({
            "containerDivId":"dwv",
            "tools": this.state.tools,
            "gui":["undo"],
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
            // if (dcmApp.isMonoSliceData() && dcmApp.getImage().getNumberOfFrames() === 1) {
            //   self.setState({selectedTool: 'ZoomAndPan'});
            // } else {
            //   self.setState({selectedTool: 'Scroll'});
            // }
          });
          // store
          this.setState({dwvApp: dcmApp});
    }

    componentWillMount(){
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

      onStateSave = ()=>{
        if(this.state.dwvApp){
          console.log("called")
          this.state.dwvApp.onStateSave();
          let fname = this.state.tags.filter(i => i.name === 'PatientName');
          this.state.dwvApp.getElement("download-state").download = fname[0].value+".json"
        }
      }

      handleUndo = ()=>{
        console.log("called");
        if(this.state.dwvApp){
          this.state.dwvApp.onUndo();
        }
      }
      
      handleRedo = ()=>{
        if(this.state.dwvApp){
          this.state.dwvApp.onRedo();
        }
      }

      handleKeyDown = event => {
        if(event.shiftKey && event.which == 90){
          if ( this.state.dwvApp ) {
            this.setState({selectedTool: "ZoomAndPan"});
            this.state.dwvApp.onChangeTool({currentTarget: { value: "ZoomAndPan" } });
          }
        }else if(event.shiftKey && event.which == 68){
          if ( this.state.dwvApp ) {
            this.setState({selectedTool: "Draw"});
            this.state.dwvApp.onChangeTool({currentTarget: { value: "Draw" } });
          }
        }
      }
      
      onChangeTool = event => {
        if ( this.state.dwvApp ) {
          this.setState({selectedTool: event.target.value});
          this.state.dwvApp.onChangeTool({currentTarget: { value: event.target.value } });
        }
      }

      onChangeShape = event =>{
        if ( this.state.dwvApp ) {
          this.setState({selectedShape: event.target.value});
          this.state.dwvApp.onChangeShape({currentTarget: {value: event.target.value} });
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
        let array = this.state.url.split(",");
        this.state.dwvApp.loadURLs(urlsArray ? urlsArray : array);
        // this.state.dwvApp.loadURLs(urlsArray ? urlsArray : [this.state.url]);
        //this.state.dwvApp.loadURLs(urlsArray ? urlsArray : ['https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323851.dcm']);
      }
};



export default DwvComponent;