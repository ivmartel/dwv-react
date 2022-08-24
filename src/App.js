import React, { Component } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { indigo, pink } from '@mui/material/colors';

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <DwvComponent />
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
