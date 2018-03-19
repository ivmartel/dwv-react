import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DwvApp from './DwvApp';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<DwvApp />, document.getElementById('root'));
registerServiceWorker();
