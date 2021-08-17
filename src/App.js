import React, { Component } from 'react';

import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import indigo from '@material-ui/core/colors/indigo';
import pink from '@material-ui/core/colors/pink';

import './App.css';
import DwvComponent from './DwvComponent';

const theme = createTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: indigo,
    secondary: pink,
    type: 'light'
  }
});

class App extends Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <DwvComponent />
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
