import {
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Alert,
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SaveIcon from '@mui/icons-material/Save';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  useAnnotationService,
  useAnnotationState
} from '../services/AnnotationServiceProvider.jsx';
import { getQuantificationGroups } from '../services/quantification.js';

import { getShapeIcon } from './shapeIcons.jsx';

/**
 * Mapped to the dwv `dev/viewer/src/annotationComponent.js`:
 *   React renderer of the annotation service state.
 */

/**
 * Get the key of an annotation.
 *
 * @param {string} dataId The annotation group data id.
 * @param {string} annotationId The annotation tracking UID.
 * @returns {string} The key.
 */
const getAnnotationKey = (dataId, annotationId) =>
  `${dataId}-${annotationId}`;

/**
 * Download a blob.
 *
 * @param {Blob} blob The blob.
 * @param {string} fileName The file name.
 */
const downloadBlob = (blob, fileName) => {
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  element.download = fileName;
  element.click();
  URL.revokeObjectURL(element.href);
};

/**
 * Stop an event propagation: the annotation item click
 *   triggers a go to.
 *
 * @param {Event} event The event.
 */
const stopPropagation = (event) => {
  event.stopPropagation();
};

/**
 * Colour input: a square swatch with the size of a small icon button
 *   (so that it aligns with the other row actions).
 */
const ColourInput = styled('input')(({ theme }) => ({
  boxSizing: 'border-box',
  width: 30,
  height: 30,
  // swatch size of a small icon (20px)
  padding: 5,
  margin: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'none',
  cursor: 'pointer',
  appearance: 'none',
  '&:hover:not(:disabled)': {
    backgroundColor: theme.palette.action.hover
  },
  '&:disabled': {
    cursor: 'default',
    opacity: theme.palette.action.disabledOpacity
  },
  '&::-webkit-color-swatch-wrapper': {
    padding: 0
  },
  '&::-webkit-color-swatch': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2
  },
  '&::-moz-color-swatch': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2
  }
}));

/**
 * Quantification details of an annotation.
 *
 * @param {object} props The component props.
 * @param {object|undefined} props.quantification The quantification.
 * @returns {React.ReactElement} The element.
 */
const Quantification = ({ quantification }) => {
  const groups = getQuantificationGroups(quantification);
  if (groups.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No quantification.
      </Typography>
    );
  }
  // one line per group (wrapped if too long): title then label/value pairs
  return groups.map((group) => (
    <Box key={group.title}
      sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline',
        columnGap: 2}}>
      <Typography variant="body2" color="textSecondary"
        sx={{fontWeight: 'medium'}}>
        {group.title}
      </Typography>
      <Box component="dl" sx={{m: 0, display: 'contents'}}>
        {group.items.map((item) => (
          <Box key={item.label} sx={{display: 'flex', gap: 0.5}}>
            <Typography component="dt" variant="body2"
              color="textDisabled">
              {item.label}:
            </Typography>
            <Typography component="dd" variant="body2" sx={{m: 0}}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  ));
};

/**
 * Annotation item.
 *
 * @param {object} props The component props.
 * @param {string} props.dataId The annotation group data id.
 * @param {boolean} props.editable True if the group is editable.
 * @param {import('../services/AnnotationService.js').AnnotationItemState}
 *   props.annotation The annotation state.
 * @param {boolean} props.selected True if selected.
 * @param {boolean} props.detailsOpen True if the details are shown.
 * @param {Function} props.onToggleDetails Details toggle callback.
 * @returns {React.ReactElement} The element.
 */
const AnnotationItem = ({
  dataId,
  editable,
  annotation,
  selected,
  detailsOpen,
  onToggleDetails
}) => {

  const annotationService = useAnnotationService();
  const itemRef = useRef(null);

  // scroll into view on selection
  useEffect(() => {
    if (selected) {
      itemRef.current?.scrollIntoView?.({block: 'nearest'});
    }
  }, [selected]);

  const annotationId = annotation.id;

  const onClick = () => {
    annotationService.selectAnnotation(dataId, annotationId);
    annotationService.gotoAnnotation(dataId, annotationId);
  };

  return (
    <ListItem
      ref={itemRef}
      disablePadding
      sx={{display: 'block'}}
      >
      <ListItemButton
        dense
        selected={selected}
        title="Go to annotation"
        onClick={onClick}
        sx={{py: 0.75, pr: 0.5}}
        >
        <ListItemIcon sx={{minWidth: 32}}>
          {getShapeIcon(annotation.factoryName, {fontSize: 'small'})}
        </ListItemIcon>
        <ListItemText
          primary={annotation.label}
          sx={{my: 0, minWidth: 0}}
          slotProps={{primary: {
            noWrap: true,
            // strike through non viewable annotations
            sx: annotation.canView
              ? undefined : {textDecoration: 'line-through'}
          }}}
        />
        <Stack
          direction="row"
          alignItems="center"
          sx={{flex: 'none'}}
          // actions do not trigger the row go to (nor its ripple)
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onKeyDown={stopPropagation}
          >
          <IconButton
            size="small"
            title="Show/hide quantification"
            aria-expanded={detailsOpen}
            onClick={onToggleDetails}
            >
            {detailsOpen
              ? <InfoIcon fontSize="small" />
              : <InfoOutlinedIcon fontSize="small" />}
          </IconButton>
          <ColourInput
            type="color"
            title="Change annotation colour"
            aria-label="Change annotation colour"
            value={annotation.colour}
            disabled={!editable}
            onChange={(event) => annotationService.changeAnnotationColour(
              dataId, annotationId, event.target.value)}
          />
          <IconButton
            size="small"
            title="Show/hide annotation"
            aria-pressed={!annotation.visible}
            onClick={() => annotationService.setAnnotationVisibility(
              dataId, annotationId, !annotation.visible)}
            >
            {annotation.visible
              ? <VisibilityIcon fontSize="small" />
              : <VisibilityOffIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            title="Delete annotation"
            disabled={!editable}
            onClick={() => annotationService.deleteAnnotation(
              dataId, annotationId)}
            >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </ListItemButton>
      <Collapse in={detailsOpen} unmountOnExit>
        <Box sx={{px: 2, py: 0.5}}>
          <Quantification quantification={annotation.quantification} />
        </Box>
      </Collapse>
    </ListItem>
  );
};

/**
 * Annotation group.
 *
 * @param {object} props The component props.
 * @param {import('../services/AnnotationService.js').AnnotationGroupState}
 *   props.group The group state.
 * @param {import('../services/AnnotationService.js').AnnotationSelection}
 *   props.selected The selection.
 * @param {Set<string>} props.openDetails The keys of the annotations
 *   with open details.
 * @param {Function} props.onToggleDetails Details toggle callback,
 *   called with the annotation key.
 * @param {Function} props.onError Error callback.
 * @returns {React.ReactElement} The element.
 */
const AnnotationGroup = ({
  group,
  selected,
  openDetails,
  onToggleDetails,
  onError
}) => {

  const annotationService = useAnnotationService();

  const dataId = group.dataId;

  const onSave = () => {
    try {
      const blob = annotationService.getAnnotationGroupAsDicom(dataId);
      downloadBlob(blob, `dicom-sr-${dataId}.dcm`);
    } catch (error) {
      console.error(error);
      onError(error.message);
    }
  };

  return (
    <Box sx={{mb: 2}}>
      {/* same horizontal padding as the rows to align the actions */}
      <Stack direction="row" alignItems="center"
        sx={{pl: 2, pr: 0.5, py: 0.5}}>
        <Typography variant="subtitle2" sx={{flex: 1}} noWrap>
          group #{dataId}
        </Typography>
        <IconButton
          size="small"
          title={group.editable ? 'Lock group' : 'Unlock group'}
          aria-pressed={!group.editable}
          onClick={() => annotationService.setAnnotationGroupEditable(
            dataId, !group.editable)}
          >
          {group.editable
            ? <LockOpenIcon fontSize="small" />
            : <LockIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          title="Save annotation group"
          onClick={onSave}
          >
          <SaveIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          title="Show/hide annotation labels"
          aria-pressed={!group.labelsVisible}
          onClick={() => annotationService.setLabelsVisibility(
            dataId, !group.labelsVisible)}
          >
          {group.labelsVisible
            ? <LabelIcon fontSize="small" />
            : <LabelOffIcon fontSize="small" />}
        </IconButton>
      </Stack>
      {group.annotations.length === 0
        ? (
          <Typography variant="body2" color="textSecondary"
            sx={{px: 2, py: 0.75}}>
            No annotation.
          </Typography>
        )
        : (
          <List dense disablePadding>
            {group.annotations.map((annotation) => {
              const key = getAnnotationKey(dataId, annotation.id);
              return (
                <AnnotationItem
                  key={key}
                  dataId={dataId}
                  editable={group.editable}
                  annotation={annotation}
                  selected={selected?.dataId === dataId &&
                    selected?.annotationId === annotation.id}
                  detailsOpen={openDetails.has(key)}
                  onToggleDetails={() => onToggleDetails(key)}
                />
              );
            })}
          </List>
        )
      }
    </Box>
  );
};

/**
 * Annotation component: list of the annotation groups and
 *   their annotations.
 *
 * @returns {React.ReactElement} The element.
 */
const AnnotationComponent = () => {

  const state = useAnnotationState();

  // keys of the annotations with open quantification details
  // (view only state)
  const [openDetails, setOpenDetails] = useState(() => new Set());
  const [errorMessage, setErrorMessage] = useState(undefined);

  const onToggleDetails = (key) => {
    setOpenDetails((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Box>
      {errorMessage &&
        <Alert severity="warning" sx={{mb: 1}}
          onClose={() => setErrorMessage(undefined)}>
          {errorMessage}
        </Alert>
      }
      {state.groups.map((group) => (
        <AnnotationGroup
          key={group.dataId}
          group={group}
          selected={state.selected}
          openDetails={openDetails}
          onToggleDetails={onToggleDetails}
          onError={setErrorMessage}
        />
      ))}
    </Box>
  );

} // AnnotationComponent

export default (AnnotationComponent);
