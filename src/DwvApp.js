import React from 'react';
import Button from 'material-ui/Button';
import './DwvApp.css';
import dwv from 'dwv';

// button margin
const styles = {
  button: {
    margin: 2,
  }
};

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

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "assets/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "assets/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "assets/dwv/decoders/pdfjs/decode-jpegbaseline.js"
};

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
          <Button variant="raised" color="primary" value="Scroll" onClick={this.onClick.bind(this)} style={styles.button}>Scroll</Button>
          <Button variant="raised" color="primary" value="WindowLevel" onClick={this.onClick.bind(this)} style={styles.button}>WindowLevel</Button>
          <Button variant="raised" color="primary" value="ZoomAndPan" onClick={this.onClick.bind(this)} style={styles.button}>ZoomAndPan</Button>
          <Button variant="raised" color="primary" value="Draw" onClick={this.onClick.bind(this)} style={styles.button}>Draw</Button>
        </div>
        <div className="layerContainer">
          <div className="dropBox"></div>
          <canvas className="imageLayer">Only for HTML5 compatible browsers...</canvas>
          <div className="drawDiv"></div>
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
      "tools": ["Scroll", "ZoomAndPan", "WindowLevel", "Draw"],
      "shapes": ["Ruler"],
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
