import React from 'react';
import ReactDOM from 'react-dom';
import DwvApp from './DwvApp';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<DwvApp />, div);
});
