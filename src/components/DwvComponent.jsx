import {
  useEffect,
  useRef,
  useState
} from 'react';
import { styled } from '@mui/material/styles';
import { Alert, Snackbar } from '@mui/material';

import { useDwvAppService } from '../services/DwvAppServiceProvider.jsx';

import Header from './Header.jsx';
import Content from './Content.jsx';
import Footer from './Footer.jsx';

import './DwvComponent.css';

const Root = styled('div')();

const DwvComponent = () => {

  const dwvAppService = useDwvAppService();

  const hasInitialized = useRef(false);

  const [errorMessage, setErrorMessage] = useState(undefined);

  useEffect(() => {
    // possible load from location
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dwvAppService.loadFromUri(window.location.href);
    }
  }, [dwvAppService]);

  useEffect(() => {
    const handleError = (event) => {
      setErrorMessage(event.detail.value);
    };
    dwvAppService.addEventListener('error', handleError);
    return () => {
      dwvAppService.removeEventListener('error', handleError);
    };
  }, [dwvAppService]);

  const handleErrorClose = (_event, reason) => {
    // keep the message on click away
    if (reason !== 'clickaway') {
      setErrorMessage(undefined);
    }
  };

  return (
    <Root className="dwv">
      <Header />
      <Content className="content"/>
      <Footer />
      <Snackbar
        open={errorMessage !== undefined}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        >
        <Alert severity="error" variant="filled" onClose={handleErrorClose}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Root>
  );

} // DwvComponent

export default (DwvComponent);
