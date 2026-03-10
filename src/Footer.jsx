import { version } from 'react';
import { styled } from '@mui/material/styles';
import {
  Typography,
  Link,
} from '@mui/material';

import { useDwvService } from './DwvServiceProvider.jsx';

import './Footer.css';

const Root = styled('div')();

const Footer = () => {

  const dwvService = useDwvService();

  const versions = {
    dwv: dwvService.getDwvVersion(),
    react: version
  };

  return (
    <Root className="footer">
      <p className="legend">
        <Typography variant="caption">Powered by <Link
            href="https://github.com/ivmartel/dwv"
            title="dwv on github"
            color="inherit">dwv
          </Link> {versions.dwv} and <Link
            href="https://github.com/facebook/react"
            title="react on github"
            color="inherit">React
          </Link> {versions.react}
        </Typography>
      </p>
    </Root>
  );

} // Footer

export default (Footer);
