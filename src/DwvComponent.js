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
import { WithContext as ReactTags } from 'react-tag-input';
import axios from 'axios';
 
const KeyCodes = {
  comma: 188,
  enter: 13,
};
 
const delimiters = [KeyCodes.comma, KeyCodes.enter];


// decode query
dwv.utils.decodeQuery = dwv.utils.base.decodeQuery;
// progress
dwv.gui.displayProgress = function () {};
// get element
dwv.gui.getElement = dwv.gui.base.getElement;
// refresh element
dwv.gui.refreshElement = dwv.gui.base.refreshElement;

dwv.gui.Undo = dwv.gui.base.Undo;

dwv.gui.Loadbox = dwv.gui.base.Loadbox;
// File loader
dwv.gui.FileLoad = dwv.gui.base.FileLoad;
// Folder loader
dwv.gui.FolderLoad = dwv.gui.base.FolderLoad;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "assets/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "assets/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "assets/dwv/decoders/pdfjs/decode-jpegbaseline.js"
};

class DwvComponent extends React.Component{
  constructor(props){
    super(props);
    this.state={
      tools: ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'],
      loadProgress: 0,
      dataLoaded: false,
      dwvApp: null,
      tags: [],
      caseTags: [],
      suggestions: [],
      url: '', 
      currentPosition: '',
      selectedTool: 'ZoomAndPan',
      selectedShape: 'Ruler',
      showDicomTags: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleRedo = this.handleRedo.bind(this);
    this.getPreviousImage = this.getPreviousImage.bind(this);
    this.getNextImage = this.getNextImage.bind(this);
    this.onStateSave= this.onStateSave.bind(this);
    this.onChangeTool = this.onChangeTool.bind(this);
    this.onChangeShape = this.onChangeShape.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
  }
  handleDelete(i) {
    const { caseTags } = this.state;
    this.setState({
     caseTags: caseTags.filter((caseTag, index) => index !== i),
    });
  }

  handleAddition(caseTag) {
      this.setState(state => ({ caseTags: [...state.caseTags, caseTag] }));
  }

  handleDrag(caseTag, currPos, newPos) {
      const caseTags = [...this.state.caseTags];
      const newTags = caseTags.slice();

      newTags.splice(currPos, 1);
      newTags.splice(newPos, 0, caseTag);

      // re-render
      this.setState({ caseTags: newTags });
  }

  handleChange(event){
    this.setState({
      tools: this.state.tools,
      loadProgress: this.state.loadProgress,
      dataLoaded: this.state.dataLoaded,
      dwvApp: this.state.dwvApp,
      tags: this.state.tags,
      caseTags: this.state.caseTags,
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
    const { caseTags, suggestions } = this.state;
    
    return (
      <div id="dwv" className="uk-grid">
        <div className="uk-width-2-5 sectionsContainer">
          <div className="sectionDiv urlSection">
            <input placeholder="Enter URL" className="inputField" value={this.state.url} onChange={this.handleChange}/>
            <button className="uk-button uk-button-secondary" onClick={this.loadFromURL}>Load Image</button>
            <br/> 

            {(this.state.dataLoaded) && <button className="uk-button uk-button-secondary" onClick={this.handleTagsDialogOpen}>Tags</button>}
            {(this.state.dataLoaded) && <a  className="uk-button uk-button-primary download-state" onClick={this.onStateSave}>Save</a>}
          </div>           
          

          <div className="sectionDiv toolSection" hidden={!this.state.dataLoaded}>
            <div onChange={this.onChangeTool} hidden={!this.state.dataLoaded}>
              <label className="uk-label">Select a tool</label>
              <br/>

              <span className="radios">
                <input className="uk-radio" type="radio" value="ZoomAndPan" name="tool" checked={this.state.selectedTool === 'ZoomAndPan'}/>Zoom and Pan 
                <input className="uk-radio" type="radio" value="Scroll" name="tool" checked={this.state.selectedTool === 'Scroll'}/>Scroll 

                <input className="uk-radio" type="radio" value="WindowLevel" name="tool" checked={this.state.selectedTool === 'WindowLevel'}/>WindowLevel 
                <input className="uk-radio" type="radio" value="Draw" name="tool" checked={this.state.selectedTool === 'Draw'}/>Draw 
              </span>
            </div>

            <div onChange={this.onChangeShape} hidden={this.state.selectedTool !== "Draw"}>
              <label className="uk-label">Select a shape</label>
              <br/>
              <span className="radios">
                <input className="uk-radio" type="radio" value="Ruler" name="shape" checked={this.state.selectedShape === 'Ruler'}/>Ruler
                <input className="uk-radio" type="radio" value="FreeHand" name="shape" />FreeHand 

                <input className="uk-radio" type="radio" value="Protractor" name="shape" />Protractor
                <input className="uk-radio" type="radio" value="Rectangle" name="shape" />Rectangle
              </span>
              <span className="radios">
                <input className="uk-radio" type="radio" value="Roi" name="shape" />Roi
                <input className="uk-radio" type="radio" value="Ellipse" name="shape" />Ellipse
                <input className="uk-radio" type="radio" value="Arrow" name="shape" />Arrow
              </span>
            </div>
          </div>
          
          <div className="sectionDiv actSection" hidden={!this.state.dataLoaded}>
            <label className="uk-label">Actions</label> 
            <br/>
            <button className="uk-button uk-button-secondary" onClick={this.onReset}>Reset Zoom</button>
            <button className="uk-button uk-button-secondary" onClick={this.handleUndo}>Undo</button>
            <button className="uk-button uk-button-secondary" onClick={this.handleRedo}>Redo</button>
          </div>
            
          <div className="sectionDiv tagSection" hidden={!this.state.dataLoaded}>
            <label className="uk-label">Additional Tags</label>
            <ReactTags tags={caseTags}
                suggestions={suggestions}
                handleDelete={this.handleDelete}
                handleAddition={this.handleAddition}
                handleDrag={this.handleDrag}
                delimiters={delimiters} />
          </div>

          <Dialog open={this.state.showDicomTags} onClose={this.handleTagsDialogClose}>
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
        <div className="loaderlist" hidden></div>


        <div className="uk-width-3-5 ">
          <div className="layerContainer">
              <div className="dropBox" style={background}>Drag and drop dcm file here.</div>
              <canvas className="imageLayer" >Only for HTML5 compatible browsers...</canvas>
              <div className="drawDiv" ></div>
          </div>
          
          <div className="uk-section">
            {this.state.currentPosition && this.state.currentPosition > 1 && <button className="uk-button" onClick={this.getPreviousImage}>Previous</button>}
            {this.state.currentPosition && this.state.currentPosition < this.state.url.split(",").length && <button className="uk-button" onClick={this.getNextImage}>Next</button>}
          </div>
        </div>
                        
        <div className="history" hidden></div>
      </div>
    );
  }
  
  componentDidMount(){
    axios.get('http://localhost:4000/suggestions')
      .then(response => {
        this.setState({ suggestions: response.data });
      })
      .catch(function (error) {
        console.log(error);
      })
    
    var dcmApp = new dwv.App()
    dcmApp.init({
        "containerDivId":"dwv",
        "tools": this.state.tools,
        "loaders": ["File", "Folder", "Url"],
        "gui":["undo", "load"],
        "shapes": ["Ruler","FreeHand", "Protractor", "Rectangle", "Roi", "Ellipse", "Arrow"],
        "isMobile": true
    })
    var self = this;
    dcmApp.addEventListener("load-end", function (event) {
      // set data loaded flag
      self.setState({dataLoaded: true});
      // set dicom tags
      self.setState({tags: dcmApp.getTags(), currentPosition: dcmApp.getViewController().getCurrentPosition().k + 1 });
      if(dcmApp.isMonoSliceData() && dcmApp.getImage().getNumberOfFrames() ===1 ){
        self.setState({selectedTool:'ZoomAndPan'})
      }else{
        self.setState({selectedTool: 'Scroll'});
      }
    });
    dcmApp.onStateSave = function(){
      var state = new dwv.State();
      var data = JSON.parse(state.toJSON(self.state.dwvApp));
      data.caseTags = self.state.caseTags;
        // add href to link (html5)
        var element = self.state.dwvApp.getElement("download-state");
        var blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        element.href = window.URL.createObjectURL(blob);
    }
    // store
    this.setState({dwvApp: dcmApp});
    dcmApp.addEventListener("slice-change", function () {
      self.setState({currentPosition: dcmApp.getViewController().getCurrentPosition().k + 1});
    });
    console.log("component mounted")
    
  }

  componentWillMount(){
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  getPreviousImage=()=>{
    if(this.state.dwvApp){
      let pos = this.state.dwvApp.getViewController().getCurrentPosition()
      if(pos.k>0){
        pos.k -= 1
        this.state.dwvApp.getViewController().setCurrentPosition(pos);
        this.setState({
          currentPosition: pos.k + 1
        })
      }
    }
  }

  getNextImage= ()=>{
     if(this.state.dwvApp){
      let pos = this.state.dwvApp.getViewController().getCurrentPosition()
      if(pos.k <this.state.url.split(",").length){
        pos.k += 1
        this.state.dwvApp.getViewController().setCurrentPosition(pos);
        this.setState({
          currentPosition: pos.k + 1
        })
      }
    }
  }


  onStateSave = ()=>{
    if(this.state.dwvApp){
      this.state.dwvApp.onStateSave();
      let fname = this.state.tags.filter(i => i.name === 'PatientName');
      this.state.dwvApp.getElement("download-state").download = fname[0].value+".json"
    }
    // let data = this.state.caseTags;
    axios
      .post('http://localhost:4000/suggestions',{suggestions: this.state.caseTags})
      .then(res=>{
        console.log(res);
      })
  }

  handleUndo = ()=>{
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
    if(event.shiftKey && event.which === 90){
      if ( this.state.dwvApp ) {
        this.setState({selectedTool: "ZoomAndPan"});
        this.state.dwvApp.onChangeTool({currentTarget: { value: "ZoomAndPan" } });
      }
    }else if(event.shiftKey && event.which === 68){
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
    //https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323851.dcm,https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323707.dcm,https://raw.githubusercontent.com/ivmartel/dwv/master/tests/data/bbmri-53323563.dcm
  }
};

export default DwvComponent;