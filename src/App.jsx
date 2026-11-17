import { useMemo } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  colors
} from '@mui/material';

import DwvViewer from './components/DwvViewer.jsx';

import './App.css';

export default function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = useMemo(() => {
      const mode = prefersDarkMode ? 'dark' : 'light';
      return createTheme({
        palette: {
          primary: {
            main: colors.indigo[500]
          },
          secondary: {
            main: colors.pink[500]
          },
          mode: mode,
          background: {
            // custom token (Material 3 like 'surface-container'):
            // side panels, follows the palette mode
            surfaceContainer: mode === 'dark'
              ? colors.grey[900]
              : colors.grey[100]
          }
        }
      });
    }, [prefersDarkMode]);

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <DwvViewer loadFromWindowLocation showLegend />
        </div>
      </ThemeProvider>
    );
}
