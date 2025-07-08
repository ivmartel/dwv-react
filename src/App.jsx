import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  colors
} from '@mui/material';

import DwvComponent from './DwvComponent.jsx';

import './App.css';

export default function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = createTheme({
      typography: {
        useNextVariants: true,
      },
      palette: {
        primary: {
          main: colors.indigo[500]
        },
        secondary: {
          main: colors.pink[500]
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
