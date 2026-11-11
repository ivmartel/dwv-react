import {
  useState,
  useRef,
} from 'react';
import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import './RightPanel.css';

const MIN_WIDTH = 150;
const DEFAULT_WIDTH = 300;
// maximum width as a fraction of the parent width
const MAX_WIDTH_RATIO = 0.8;

const Root = styled('div')(({ theme }) => ({
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.surfaceContainer ??
    theme.palette.background.paper,
  '& .resizeHandle:hover, & .resizeHandle.dragging': {
    backgroundColor: theme.palette.primary.main,
  },
}));

/**
 * Foldable and resizable right panel.
 * @param {object} props The component props.
 * @param {React.ReactNode} props.children The panel content.
 * @returns {React.ReactElement} The panel element.
 */
const RightPanel = ({ children }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  const rootRef = useRef(null);

  /**
   * Start resizing on handle pointer down.
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  /**
   * Resize while dragging the handle.
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerMove = (event) => {
    if (!isDragging || !rootRef.current) {
      return;
    }
    // the panel is right aligned: its width is the distance
    // from the pointer to the parent right border
    const parent = rootRef.current.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const maxWidth = parentRect.width * MAX_WIDTH_RATIO;
    const newWidth = parentRect.right - event.clientX;
    setWidth(Math.round(Math.min(Math.max(newWidth, MIN_WIDTH), maxWidth)));
  };

  /**
   * Stop resizing on handle pointer up.
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  const toggleTitle = isOpen ? 'Close panel' : 'Open panel';

  return (
    <Root
      ref={rootRef}
      className={'rightPanel' + (isOpen ? ' open' : '')}
      style={isOpen ? {width: width} : undefined}
      >
      {isOpen &&
        <div
          className={'resizeHandle' + (isDragging ? ' dragging' : '')}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          />
      }
      <div className="rightPanelBar">
        <IconButton
          size="small"
          title={toggleTitle}
          onClick={() => setIsOpen(!isOpen)}
          >
          {isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </div>
      {isOpen &&
        <div className="rightPanelContent">
          {children}
        </div>
      }
    </Root>
  );

} // RightPanel

export default (RightPanel);
