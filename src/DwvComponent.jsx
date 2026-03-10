import {
  useEffect,
  useRef
} from 'react';
import { styled } from '@mui/material/styles';

import { useDwvService } from './DwvServiceProvider.jsx';

import Header from './Header.jsx';
import Content from './Content.jsx';
import Footer from './Footer.jsx';

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
      <Header />
      <Content className="content"/>
      <Footer />
    </Root>
  );

} // DwvComponent

export default (DwvComponent);
