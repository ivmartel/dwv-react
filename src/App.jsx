import { useMemo } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  colors
} from '@mui/material';

import DwvComponent from './components/DwvComponent.jsx';
import { DwvServiceProvider } from './services/DwvServiceProvider.jsx';

import './App.css';

export default function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = useMemo(() => createTheme({
      palette: {
        primary: {
          main: colors.indigo[500]
        },
        secondary: {
          main: colors.pink[500]
        },
        mode: prefersDarkMode ? 'dark' : 'light',
      }
    }), [prefersDarkMode]);

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DwvServiceProvider>
          <div className="App">
            <DwvComponent />
          </div>
        </DwvServiceProvider>
      </ThemeProvider>
    );
}
