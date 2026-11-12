import {
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Collapse,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

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
 * Design spec: `doc/design/AnnotationComponent.md`.
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
 * Get the html element id of an annotation.
 *
 * @param {string} dataId The annotation group data id.
 * @param {string} annotationId The annotation tracking UID.
 * @returns {string} The element id.
 */
const getAnnotationElementId = (dataId, annotationId) =>
  `annotationgroup${dataId}-annotation${annotationId}`;

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
 * Get the 'on container' colour of a palette colour: dark variant
 *   in light mode, light variant in dark mode.
 *
 * @param {object} theme The MUI theme.
 * @param {object} color The palette colour.
 * @returns {string} The colour.
 */
const getOnContainerColour = (theme, color) =>
  theme.palette.mode === 'dark' ? color.light : color.dark;

/**
 * Action icon button: 28px hit area, 18px icon, primary container
 *   background when pressed.
 */
const ActionButton = styled(IconButton)(({ theme }) => ({
  width: 28,
  height: 28,
  padding: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 18
  },
  '&[aria-pressed="true"]': {
    backgroundColor: alpha(theme.palette.primary.main,
      theme.palette.action.activatedOpacity),
    color: getOnContainerColour(theme, theme.palette.primary)
  }
}));

/**
 * Colour input: a 20px square swatch.
 */
const ColourInput = styled('input')(({ theme }) => ({
  boxSizing: 'border-box',
  flex: 'none',
  width: 20,
  height: 20,
  padding: 0,
  margin: '0 4px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  appearance: 'none',
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
 * Annotation row: raised surface, darkened on hover, secondary
 *   container when selected.
 */
const AnnotationRow = styled('li')(({ theme }) => ({
  listStyle: 'none',
  borderRadius: 4,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    // state layer: 8% of the text colour
    backgroundImage: `linear-gradient(${
      alpha(theme.palette.text.primary, 0.08)}, ${
      alpha(theme.palette.text.primary, 0.08)})`
  },
  '&.selected': {
    backgroundColor: alpha(theme.palette.secondary.main,
      theme.palette.action.activatedOpacity),
    color: getOnContainerColour(theme, theme.palette.secondary),
    // dark mode: dark blue background, default (white) text
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.text.primary
    })
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
      <Typography variant="caption" component="div"
        sx={{fontStyle: 'italic'}}>
        No quantification
      </Typography>
    );
  }
  // one line per group (wrapped if too long): title then items
  return groups.map((group) => (
    <Box key={group.title}
      sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline',
        columnGap: 1}}>
      <Typography variant="caption" component="div"
        sx={{fontWeight: 'medium'}}>
        {group.title}
      </Typography>
      <Box component="dl" sx={{m: 0, display: 'contents'}}>
        {group.items.map((item) => (
          <Box key={item.label} title={item.label}
            sx={{display: 'flex', alignItems: 'baseline', gap: 0.5}}>
            <Typography component="dt" variant="caption"
              color="textSecondary"
              sx={{opacity: 0.7, fontSize: '0.9em'}}>
              {item.shortLabel}
            </Typography>
            <Typography component="dd" variant="caption" sx={{m: 0}}>
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

  // scroll into view on selection (after rendering)
  useEffect(() => {
    if (selected) {
      itemRef.current?.scrollIntoView?.({block: 'nearest'});
    }
  }, [selected]);

  const annotationId = annotation.id;
  const elementId = getAnnotationElementId(dataId, annotationId);
  const detailsId = `qd-${elementId}`;

  const onClick = () => {
    annotationService.selectAnnotation(dataId, annotationId);
    annotationService.gotoAnnotation(dataId, annotationId);
  };

  return (
    <AnnotationRow
      ref={itemRef}
      id={elementId}
      className={selected ? 'selected' : undefined}
      >
      <Stack direction="row" sx={{alignItems: 'center'}}>
        <ButtonBase
          title="Go to annotation"
          onClick={onClick}
          sx={{flex: 1, minWidth: 0, justifyContent: 'flex-start',
            gap: 1, pl: 1, py: 0.5, borderRadius: 1,
            font: 'inherit', color: 'inherit'}}
          >
          {getShapeIcon(annotation.factoryName,
            {sx: {fontSize: 18, flex: 'none'}})}
          <Typography variant="body2" noWrap
            sx={annotation.canView
              ? undefined
              // strike through non viewable annotations
              : {textDecoration: 'line-through'}}>
            {annotation.label}
          </Typography>
        </ButtonBase>
        <Stack direction="row" sx={{alignItems: 'center', flex: 'none'}}>
          <ActionButton
            title="Show/hide quantification"
            aria-pressed={detailsOpen}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={onToggleDetails}
            >
            {detailsOpen ? <InfoIcon /> : <InfoOutlinedIcon />}
          </ActionButton>
          <ColourInput
            type="color"
            title="Change annotation colour"
            value={annotation.colour}
            disabled={!editable}
            onChange={(event) => annotationService.changeAnnotationColour(
              dataId, annotationId, event.target.value)}
          />
          <ActionButton
            title="Show/hide annotation"
            aria-pressed={!annotation.visible}
            onClick={() => annotationService.setAnnotationVisibility(
              dataId, annotationId, !annotation.visible)}
            >
            {annotation.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </ActionButton>
          <ActionButton
            title="Delete annotation"
            disabled={!editable}
            onClick={() => annotationService.deleteAnnotation(
              dataId, annotationId)}
            >
            <DeleteIcon />
          </ActionButton>
        </Stack>
      </Stack>
      <Collapse id={detailsId} in={detailsOpen}>
        <Box sx={{pl: 1, pr: 0.5, pb: 0.5}}>
          <Quantification quantification={annotation.quantification} />
        </Box>
      </Collapse>
    </AnnotationRow>
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
    <Box>
      <Stack direction="row"
        sx={{alignItems: 'center', pl: 1, py: 0.5}}>
        <Typography variant="subtitle2" sx={{flex: 1}} noWrap>
          group #{dataId}
        </Typography>
        <ActionButton
          title={group.editable ? 'Lock group' : 'Unlock group'}
          aria-pressed={!group.editable}
          onClick={() => annotationService.setAnnotationGroupEditable(
            dataId, !group.editable)}
          >
          {group.editable ? <LockOpenIcon /> : <LockIcon />}
        </ActionButton>
        <ActionButton
          title="Save annotation group"
          onClick={onSave}
          >
          <SaveIcon />
        </ActionButton>
        <ActionButton
          title="Show/hide annotation labels"
          aria-pressed={!group.labelsVisible}
          onClick={() => annotationService.setLabelsVisibility(
            dataId, !group.labelsVisible)}
          >
          {group.labelsVisible ? <LabelIcon /> : <LabelOffIcon />}
        </ActionButton>
      </Stack>
      {group.annotations.length === 0
        ? (
          <Typography variant="body2" color="textSecondary"
            sx={{pl: 1, py: 0.5, fontStyle: 'italic'}}>
            No annotation
          </Typography>
        )
        : (
          <Stack component="ul" spacing={0.5} sx={{m: 0, p: 0}}>
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
          </Stack>
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
    <Stack spacing={1}>
      {errorMessage &&
        <Alert severity="warning"
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
    </Stack>
  );

} // AnnotationComponent

export default (AnnotationComponent);
