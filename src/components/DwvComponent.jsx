import {
  useEffect,
  useRef
} from 'react';
import { styled } from '@mui/material/styles';

import { useDwvService } from '../services/DwvServiceProvider.jsx';

import DwvHeader from './DwvHeader.jsx';
import DwvContent from './DwvContent.jsx';
import DwvFooter from './DwvFooter.jsx';

import './DwvComponent.css';

const Root = styled('div')();

const DwvComponent = () => {

  const dwvService = useDwvService();

  const hasInitialized = useRef(false);

  useEffect(() => {
    // possible load from location
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dwvService.loadFromUri(window.location.href);
    }
  }, [dwvService]);

  return (
    <Root className="dwv">
      <DwvHeader />
      <DwvContent className="content"/>
      <DwvFooter />
    </Root>
  );

} // DwvComponent

export default (DwvComponent);
