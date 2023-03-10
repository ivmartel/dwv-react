import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { indigo, pink } from '@mui/material/colors';

import './App.css';
import DwvComponent from './DwvComponent';

export default function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = createTheme({
      typography: {
        useNextVariants: true,
      },
      palette: {
        primary: {
          main: indigo[500]
        },
        secondary: {
          main: pink[500]
        },
        mode: prefersDarkMode ? 'dark' : 'light',
      }
    });

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <DwvComponent />
        </div>
      </ThemeProvider>
    );
}
