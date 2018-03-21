import React from 'react';
import './DwvApp.css';
import dwv from 'dwv';

// gui overrides

// decode query
dwv.utils.decodeQuery = dwv.utils.base.decodeQuery;
// progress
dwv.gui.displayProgress = function () {};
// window
dwv.gui.getWindowSize = dwv.gui.base.getWindowSize;
// get element
dwv.gui.getElement = dwv.gui.base.getElement;
// refresh element
dwv.gui.refreshElement = dwv.gui.base.refreshElement;

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
          <button value="Scroll" onClick={this.onClick.bind(this)}>Scroll</button>
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
    // create app
    var app = new dwv.App();
    // initialise app
    app.init({
      "containerDivId": "dwv",
      "fitToWindow": true,
      "tools": ["Scroll", "ZoomAndPan", "WindowLevel"],
      "isMobile": true
    });
    // store
    this.setState({dwvApp: app});
  }

  onClick(event) {
    if ( this.state.dwvApp ) {
      this.state.dwvApp.onChangeTool(event);
    }
  }

}

export default DwvApp;
