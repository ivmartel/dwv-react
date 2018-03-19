import React from 'react';
import './DwvApp.css';

import dwv from 'dwv';

class DwvApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      legend: 'Powered by dwv ' + dwv.getVersion() + ' and React ' + React.version
    };
  }

  render() {
    return (
      <div id="dwv">
        <div className="button-row">
          <button value="WindowLevel" onClick={this.onClick.bind(this)}>WindowLevel</button>
          <button value="ZoomAndPan" onClick={this.onClick.bind(this)}>ZoomAndPan</button>
        </div>
        <div className="layerContainer">
          <div className="dropBox"></div>
          <canvas className="imageLayer">Only for HTML5 compatible browsers...</canvas>
        </div>
        <div className="legend">{this.state.legend}</div>
      </div>
    );
  }

  componentDidMount() {
    
    // overrides (appgui.js)

    // Progress
    dwv.gui.displayProgress = function () {};
    // Window
    dwv.gui.getWindowSize = dwv.gui.base.getWindowSize;
    // get element
    dwv.gui.getElement = dwv.gui.base.getElement;

    // launch (applauncher.js)
    var myapp = new dwv.App();
    
    myapp.init({
      "containerDivId": "dwv",
      "fitToWindow": true,
      "tools": ["Scroll", "ZoomAndPan", "WindowLevel"],
      "isMobile": true
    });
    
    // load local dicom
    myapp.loadURLs(["./assets/bbmri-53323131.dcm"]);
    
    this.setState({myapp: myapp});
  }

  onClick(event) {
    this.state.myapp.onChangeTool(event)
  }

}

export default DwvApp;
