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

/**
 * Get the list of urls from a `urls` input.
 *
 * @param {string|undefined} urls White space separated urls.
 * @returns {string[]} The list of urls (empty if none).
 */
export const getUrlList = (urls) => {
  if (!urls) {
    return [];
  }
  return urls.split(/\s+/).filter((url) => url);
};

/**
 * DWV viewer.
 *
 * Data inputs are checked in order `uri`, `urls`, then
 *   `loadFromWindowLocation`; the first one that is set is used.
 *   `uri` and `urls` are watched: when one changes to a new value,
 *   it is loaded on top of the existing data.
 *
 * @param {object} props The component properties.
 * @param {string} [props.uri] URI with search arguments describing
 *   the data to load (see dwv `App.loadFromUri`), watched.
 * @param {string} [props.urls] White space separated urls
 *   of the data to load, watched.
 * @param {boolean} [props.loadFromWindowLocation] Use the window location
 *   as input URI if it has search arguments, only read on init.
 * @param {boolean} [props.showLegend] Show the footer legend.
 * @returns {JSX.Element} The component.
 */
const DwvComponent = ({
  uri,
  urls,
  loadFromWindowLocation = false,
  showLegend = false
}) => {

  const dwvAppService = useDwvAppService();

  const [errorMessage, setErrorMessage] = useState(undefined);

  // normalised urls (white space): only a new list triggers a load
  const urlsKey = getUrlList(urls).join(' ');

  // last loaded inputs, undefined before init
  const loadedInputs = useRef(undefined);

  useEffect(() => {
    const urlList = urlsKey ? urlsKey.split(' ') : [];
    if (loadedInputs.current === undefined) {
      // init: first set input
      // (the ref makes it run once in StrictMode)
      loadedInputs.current = {uri, urlsKey};
      if (uri) {
        dwvAppService.loadFromUri(uri);
      } else if (urlList.length !== 0) {
        dwvAppService.loadURLs(urlList);
      } else if (loadFromWindowLocation && window.location.search) {
        dwvAppService.loadFromUri(window.location.href);
      }
      return;
    }
    // watch: load a new value on top of the existing data
    if (uri !== loadedInputs.current.uri) {
      loadedInputs.current.uri = uri;
      if (uri) {
        dwvAppService.loadFromUri(uri);
      }
    }
    if (urlsKey !== loadedInputs.current.urlsKey) {
      loadedInputs.current.urlsKey = urlsKey;
      if (urlList.length !== 0) {
        dwvAppService.loadURLs(urlList);
      }
    }
  }, [dwvAppService, uri, urlsKey, loadFromWindowLocation]);

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
      {showLegend && <Footer />}
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
