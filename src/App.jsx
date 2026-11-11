import { useMemo } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  colors
} from '@mui/material';

import DwvComponent from './components/DwvComponent.jsx';
import { DwvAppServiceProvider } from './services/DwvAppServiceProvider.jsx';

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
        background: {
          // custom token (Material 3 like 'surface-container'):
          // side panels, lighter than the default background
          surfaceContainer: prefersDarkMode
            ? colors.grey[900]
            : colors.grey[100]
        }
      }
    }), [prefersDarkMode]);

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DwvAppServiceProvider>
          <div className="App">
            <DwvComponent />
          </div>
        </DwvAppServiceProvider>
      </ThemeProvider>
    );
}
