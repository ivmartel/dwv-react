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

import { getTagFromKey } from 'dwv';

import Search from '@mui/icons-material/Search';

/**
 * Get the sorted instance numbers ('00200013') of the meta data.
 *
 * @param {object} metaData The meta data.
 * @returns {number[]} The sorted list, empty if no instance number.
 */
const getInstanceNumbers = (metaData) => {
  const instanceElement = metaData['00200013'];
  if (typeof instanceElement === 'undefined') {
    return [];
  }
  let values = instanceElement.value;
  if (typeof values === 'string') {
    values = [values];
  }
  return values.map(Number).sort((a, b) => a - b);
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
 * @returns {Function} The reducer.
 */
const getTagReducer = (tagData) => {
  return (accumulator, currentValue) => {
    accumulator.push({
      name: currentValue,
      value: tagData[currentValue].value
    });
    return accumulator;
  };
};

/**
 * Get a DICOM tag reducer.
 *
 * @param {object} tagData The meta data.
 * @param {number} instanceNumber The instance number.
 * @param {string} prefix The tag name prefix (used for sequences).
 * @returns {Function} The reducer.
 */
const getDicomTagReducer = (tagData, instanceNumber, prefix) => {
  return (accumulator, currentValue) => {
    const tag = getTagFromKey(currentValue);
    let name = tag.getNameFromDictionary();
    if (typeof name === 'undefined') {
      // add 'x' to help sorting
      name = 'x' + tag.getKey();
    }
    const element = tagData[currentValue];
    let value = element.value;
    // possible 'merged' object
    // (use slice method as test for array and typed array)
    if (typeof value.slice === 'undefined' &&
      typeof value[instanceNumber] !== 'undefined') {
      value = value[instanceNumber];
    }
    // force instance number (otherwise takes value in non indexed array)
    if (name === 'InstanceNumber') {
      value = instanceNumber;
    }
    const fullName = (prefix ? prefix + ' ' : '') + name;
    // recurse for sequence
    if (element.vr === 'SQ') {
      // sequence tag
      accumulator.push({name: fullName, value: ''});
      // sequence value
      for (let i = 0; i < value.length; ++i) {
        const sqItems = value[i];
        const res = Object.keys(sqItems).reduce(
          getDicomTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'),
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
 * @param {number} instanceNumber The instance number.
 * @returns {object[]} The list of items.
 */
const getMetaArray = (metaData, instanceNumber) => {
  const reducer = isDicomMeta(metaData)
    ? getDicomTagReducer(metaData, instanceNumber, '')
    : getTagReducer(metaData);
  return Object.keys(metaData).reduce(reducer, []);
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

  const instanceNumbers = useMemo(() => getInstanceNumbers(data), [data]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [search, setSearch] = useState('');

  const instanceNumber = instanceNumbers.length !== 0
    ? instanceNumbers[sliderIndex]
    : 0;

  const displayData = useMemo(
    () => filterItems(getMetaArray(data, instanceNumber), search),
    [data, instanceNumber, search]
  );

  return (
    <Box sx={{padding: '10px', overflow: 'hidden'}}>
      <Stack direction="row" spacing={2}>
        <TextField
          id="search"
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
            max={Math.max(instanceNumbers.length - 1, 0)}
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
