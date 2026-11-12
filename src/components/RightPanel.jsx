import {
  useEffect,
  useRef,
  useState
} from 'react';
import { alpha, styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import './RightPanel.css';

/**
 * Foldable and resizable right panel.
 * Design spec: `doc/design/RightPanel.md`.
 */

const PANEL_ID = 'rightPanel';
const MIN_WIDTH = 200;
const DEFAULT_WIDTH = 300;
// maximum width as a fraction of the window width
const MAX_WIDTH_RATIO = 0.5;
// keyboard resize step
const KEY_STEP = 20;

/**
 * Get the maximum panel width: half the window width, rounded,
 *   and never below the minimum.
 *
 * @returns {number} The maximum width.
 */
const getMaxWidth = () =>
  Math.max(MIN_WIDTH, Math.round(window.innerWidth * MAX_WIDTH_RATIO));

/**
 * Round and clamp a width to the width limits.
 *
 * @param {number} width The width.
 * @returns {number} The clamped width.
 */
const clampWidth = (width) =>
  Math.min(Math.max(Math.round(width), MIN_WIDTH), getMaxWidth());

/**
 * Side surface style: surface container background and
 *   outline variant left border.
 *
 * @param {object} theme The MUI theme.
 * @returns {object} The style.
 */
const surfaceStyle = (theme) => ({
  backgroundColor: theme.palette.background.surfaceContainer ??
    alpha(theme.palette.text.primary, 0.12),
  borderLeft: `1px solid ${theme.palette.divider}`
});

const ToggleStrip = styled('div')(({ theme }) => surfaceStyle(theme));

const Panel = styled('aside')(({ theme }) => ({
  '&.open': surfaceStyle(theme),
  '& .resizeHandle:hover, & .resizeHandle:focus-visible, &.resizing .resizeHandle': {
    backgroundColor: theme.palette.primary.main
  }
}));

const ToggleButton = styled(IconButton)({
  width: 24,
  height: 24,
  padding: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 18
  }
});

/**
 * Foldable and resizable right panel.
 *
 * @param {object} props The component props.
 * @param {React.ReactNode} props.children The panel content.
 * @returns {React.ReactElement} The panel element.
 */
const RightPanel = ({ children }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const toggleRef = useRef(null);
  // true if the focus has to move to the (new) toggle after rendering
  const focusToggleRef = useRef(false);
  // drag start pointer position and width
  const dragStartRef = useRef(null);

  // move the focus to the new toggle after an open/close
  useEffect(() => {
    if (focusToggleRef.current) {
      focusToggleRef.current = false;
      toggleRef.current?.focus();
    }
  }, [isOpen]);

  const onToggle = () => {
    focusToggleRef.current = true;
    setIsOpen(!isOpen);
  };

  /**
   * Start resizing on handle primary button pointer down.
   *
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {x: event.clientX, width: width};
    setIsResizing(true);
  };

  /**
   * Resize while dragging the handle: moving left widens the panel.
   *
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerMove = (event) => {
    const start = dragStartRef.current;
    if (start === null) {
      return;
    }
    setWidth(clampWidth(start.width + start.x - event.clientX));
  };

  /**
   * Stop resizing on handle pointer up or cancel.
   *
   * @param {PointerEvent} event The event to handle.
   */
  const onHandlePointerUp = (event) => {
    if (dragStartRef.current === null) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;
    setIsResizing(false);
  };

  /**
   * Resize with the keyboard.
   *
   * @param {KeyboardEvent} event The event to handle.
   */
  const onHandleKeyDown = (event) => {
    let newWidth;
    switch (event.key) {
    case 'ArrowLeft':
      newWidth = width + KEY_STEP;
      break;
    case 'ArrowRight':
      newWidth = width - KEY_STEP;
      break;
    case 'Home':
      newWidth = MIN_WIDTH;
      break;
    case 'End':
      newWidth = getMaxWidth();
      break;
    default:
      // left to the browser
      return;
    }
    event.preventDefault();
    setWidth(clampWidth(newWidth));
  };

  const toggle = (
    <ToggleButton
      ref={toggleRef}
      title={isOpen ? 'Close panel' : 'Open panel'}
      aria-expanded={isOpen}
      aria-controls={PANEL_ID}
      onClick={onToggle}
      >
      {isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </ToggleButton>
  );

  let panelClassName = 'rightPanel';
  if (isOpen) {
    panelClassName += ' open';
  }
  if (isResizing) {
    panelClassName += ' resizing';
  }

  return (
    <>
      {!isOpen &&
        <ToggleStrip className="rightPanelToggleStrip">
          {toggle}
        </ToggleStrip>
      }
      <Panel
        id={PANEL_ID}
        className={panelClassName}
        style={{width: isOpen ? width : 0}}
        aria-hidden={!isOpen}
        inert={!isOpen}
        >
        {isOpen &&
          <div
            className="resizeHandle"
            role="separator"
            tabIndex={0}
            title="Resize panel"
            aria-label="Resize panel"
            aria-orientation="vertical"
            aria-controls={PANEL_ID}
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={getMaxWidth()}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onKeyDown={onHandleKeyDown}
            />
        }
        <div className="rightPanelContent" style={{width: width}}>
          <div className="rightPanelHeader">
            {isOpen && toggle}
          </div>
          <div className="rightPanelBody">
            {children}
          </div>
        </div>
      </Panel>
    </>
  );

} // RightPanel

export default (RightPanel);
