// https://mui.com/material-ui/material-icons/
import StraightenIcon from '@mui/icons-material/Straighten';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SportsRugbyIcon from '@mui/icons-material/SportsRugby';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import PolylineIcon from '@mui/icons-material/Polyline';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

/**
 * Shape icons indexed by lower case shape name
 *   (also the dwv annotation factory names).
 */
const shapeIcons = {
  ruler: StraightenIcon,
  arrow: CallMadeIcon,
  rectangle: CropLandscapeIcon,
  circle: RadioButtonUncheckedIcon,
  ellipse: SportsRugbyIcon,
  protractor: SquareFootIcon,
  roi: PolylineIcon
};

/**
 * Get the icon of a shape.
 *
 * @param {string} shape The shape name (case insensitive).
 * @param {object} [props] Optional icon props.
 * @returns {React.ReactElement} The associated icon, a question
 *   mark if unknown.
 */
export const getShapeIcon = (shape, props) => {
  const Icon = shapeIcons[shape?.toLowerCase()] ?? QuestionMarkIcon;
  return (<Icon {...props} />);
};
