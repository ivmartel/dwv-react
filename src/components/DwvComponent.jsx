import {
  useEffect,
  useRef,
  useState
} from 'react';
import { styled } from '@mui/material/styles';
import { Alert, Snackbar } from '@mui/material';

import { useDwvService } from '../services/DwvServiceProvider.jsx';

import DwvHeader from './DwvHeader.jsx';
import DwvContent from './DwvContent.jsx';
import DwvFooter from './DwvFooter.jsx';

import './DwvComponent.css';

const Root = styled('div')();

const DwvComponent = () => {

  const dwvService = useDwvService();

  const hasInitialized = useRef(false);

  const [errorMessage, setErrorMessage] = useState(undefined);

  useEffect(() => {
    // possible load from location
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dwvService.loadFromUri(window.location.href);
    }
  }, [dwvService]);

  useEffect(() => {
    const handleError = (event) => {
      setErrorMessage(event.detail.value);
    };
    dwvService.addEventListener('error', handleError);
    return () => {
      dwvService.removeEventListener('error', handleError);
    };
  }, [dwvService]);

  const handleErrorClose = (_event, reason) => {
    // keep the message on click away
    if (reason !== 'clickaway') {
      setErrorMessage(undefined);
    }
  };

  return (
    <Root className="dwv">
      <DwvHeader />
      <DwvContent className="content"/>
      <DwvFooter />
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
