import {
  useMemo,
  useState
} from 'react';
import {
  InputAdornment,
  TextField,
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Slider,
  Stack,
  Box
} from '@mui/material';

import { getDicomTagInfo, getTagFromKey } from 'dwv';

import Search from '@mui/icons-material/Search';

/**
 * Key of the list of merge ids in merged meta data: dwv merges
 *   the meta data of the slices of a volume and stores the ids
 *   of the merged slices (the instance number, followed by
 *   '-<volume index>' for multi-volume data) under this key.
 */
const mergeIdKey = 'mergeId';

/**
 * Get the sorted merge ids of the meta data.
 *
 * @param {object} metaData The meta data.
 * @returns {string[]} The sorted list, empty if not merged.
 */
const getMergeIds = (metaData) => {
  const ids = metaData[mergeIdKey];
  if (!Array.isArray(ids)) {
    return [];
  }
  return [...ids].sort(
    (a, b) => a.localeCompare(b, undefined, {numeric: true}));
};

/**
 * Get the value of a meta data element for a merge id: values that
 *   differ between the merged slices are objects indexed by merge id.
 *
 * @param {*} value The element value.
 * @param {string|undefined} mergeId The merge id.
 * @returns {*} The value for the merge id.
 */
const getMergedValue = (value, mergeId) => {
  if (typeof mergeId !== 'undefined' &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !ArrayBuffer.isView(value) &&
    typeof value[mergeId] !== 'undefined') {
    return value[mergeId];
  }
  return value;
};

/**
 * Check if the meta data is DICOM.
 *
 * @param {object} metaData The meta data.
 * @returns {boolean} True if DICOM.
 */
const isDicomMeta = (metaData) => {
  return typeof metaData['00020010'] !== 'undefined';
};

/**
 * Get a non DICOM tag reducer.
 *
 * @param {object} tagData The meta data.
 * @param {string|undefined} mergeId The merge id.
 * @returns {Function} The reducer.
 */
const getTagReducer = (tagData, mergeId) => {
  return (accumulator, currentValue) => {
    accumulator.push({
      name: currentValue,
      value: getMergedValue(tagData[currentValue].value, mergeId)
    });
    return accumulator;
  };
};

/**
 * Get a DICOM tag reducer.
 *
 * @param {object} tagData The meta data.
 * @param {string|undefined} mergeId The merge id.
 * @param {string} prefix The tag name prefix (used for sequences).
 * @returns {Function} The reducer.
 */
const getDicomTagReducer = (tagData, mergeId, prefix) => {
  return (accumulator, currentValue) => {
    const tag = getTagFromKey(currentValue);
    let name = getDicomTagInfo(tag)?.getName();
    if (typeof name === 'undefined') {
      // add 'x' to help sorting
      name = 'x' + tag.getKey();
    }
    const element = tagData[currentValue];
    let value = getMergedValue(element.value, mergeId);
    const fullName = (prefix ? prefix + ' ' : '') + name;
    // recurse for sequence
    if (element.vr === 'SQ') {
      // sequence tag
      accumulator.push({name: fullName, value: ''});
      // sequence value
      for (let i = 0; i < value.length; ++i) {
        const sqItems = value[i];
        const res = Object.keys(sqItems).reduce(
          getDicomTagReducer(sqItems, mergeId, prefix + '[' + i + ']'),
          []
        );
        accumulator = accumulator.concat(res);
      }
    } else {
      // shorten long 'o'ther data
      if (element.vr[0] === 'O' && value.length > 10) {
        value = value.slice(0, 10).toString() +
          '... (len:' + value.length + ')';
      }
      accumulator.push({name: fullName, value: value.toString()});
    }
    return accumulator;
  };
};

/**
 * Get the list of {name, value} items of the meta data.
 *
 * @param {object} metaData The meta data.
 * @param {string|undefined} mergeId The merge id.
 * @returns {object[]} The list of items.
 */
const getMetaArray = (metaData, mergeId) => {
  const reducer = isDicomMeta(metaData)
    ? getDicomTagReducer(metaData, mergeId, '')
    : getTagReducer(metaData, mergeId);
  return Object.keys(metaData)
    .filter((key) => key !== mergeIdKey)
    .reduce(reducer, []);
};

/**
 * Get the instance number ('00200013') of the meta data
 *   for a merge id.
 *
 * @param {object} metaData The meta data.
 * @param {string|undefined} mergeId The merge id.
 * @returns {string} The instance number, empty if none.
 */
const getInstanceNumber = (metaData, mergeId) => {
  const element = metaData['00200013'];
  if (typeof element === 'undefined') {
    return '';
  }
  const value = getMergedValue(element.value, mergeId);
  return Array.isArray(value) ? String(value[0]) : String(value);
};

/**
 * Filter a list of items: keep the ones with a name or value
 *   containing the search string (case insensitive).
 *
 * @param {object[]} items The list of {name, value} items.
 * @param {string} search The search string.
 * @returns {object[]} The filtered list.
 */
const filterItems = (items, search) => {
  const searchLo = search.toLowerCase();
  return items.filter((item) => Object.values(item).some(
    (value) => typeof value !== 'undefined' &&
      String(value).toLowerCase().includes(searchLo)
  ));
};

const TagsTable = ({ data }) => {

  const mergeIds = useMemo(() => getMergeIds(data), [data]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [search, setSearch] = useState('');

  const mergeId = mergeIds[sliderIndex];
  const instanceNumber = getInstanceNumber(data, mergeId);

  const displayData = useMemo(
    () => filterItems(getMetaArray(data, mergeId), search),
    [data, mergeId, search]
  );

  return (
    <Box sx={{padding: '10px', overflow: 'hidden'}}>
      <Stack direction="row" spacing={2}>
        <TextField
          type="search"
          value={search}
          sx={{width: '45%'}}
          onChange={(event) => setSearch(event.target.value)}
          margin="normal"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }
          }}
        />
        <Box sx={{width: 300, display: 'flex', alignItems: 'center'}}>
          <Slider
            title="Instance number"
            sx={{margin: '20px'}}
            marks
            min={0}
            max={Math.max(mergeIds.length - 1, 0)}
            value={sliderIndex}
            onChange={(_event, value) => setSliderIndex(value)}
          />
          <div title="Instance number">{instanceNumber}</div>
        </Box>
      </Stack>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tag</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {displayData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.value}</TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

} // TagsTable

export default (TagsTable);
