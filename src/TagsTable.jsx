import React from 'react';
import { styled } from '@mui/material/styles';
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

const PREFIX = 'TagsTable';
const classes = {
  flex: `${PREFIX}-flex`,
  spacer: `${PREFIX}-spacer`,
  searchField: `${PREFIX}-searchField`,
  slider: `${PREFIX}-slider`,
  container: `${PREFIX}-container`
};

const Root = styled('div')(({theme}) => ({
  [`& .${classes.flex}`]: {
    flex: 1,
  },

  [`& .${classes.spacer}`]: {
    flex: '1 1 100%',
  },

  [`& .${classes.searchField}`]: {
    width: "45%"
  },

  [`& .${classes.slider}`]: {
    margin: 20
  },

  [`&.${classes.container}`]: {
    padding: 10,
    overflow: "hidden"
  }
}));

class TagsTable extends React.Component {

  constructor(props) {
    super(props);

    const fullMetaData = this.props.data;

    this.state = {
      fullMetaData: fullMetaData,
      searchfor: "",
      instanceNumber: 0
    };

    // set slider with instance numbers ('00200013')
    const instanceElement = fullMetaData['00200013'];
    if (typeof instanceElement !== 'undefined') {
      let instanceNumberValue = instanceElement.value;
      if (typeof instanceNumberValue === 'string') {
        instanceNumberValue = [instanceNumberValue];
      }
      // convert string to numbers
      this.state.instanceNumbers = instanceNumberValue.map(Number);
      this.state.instanceNumbers.sort((a, b) => a - b);
      this.state.sliderMin = 0;
      this.state.sliderMax = this.state.instanceNumbers.length - 1;
      this.state.instanceNumber = this.state.instanceNumbers[
        this.state.sliderMin
      ];
    }

    this.state.displayData = this.getMetaArray(this.state.instanceNumber);

    // bind listener
    this.filterList = this.filterList.bind(this);
  }

  filterList(search, instanceNumber) {
    var searchLo = search.toLowerCase();
    var metaArray = this.getMetaArray(instanceNumber);
    var updatedList = metaArray.filter( function (item) {
      for ( var key in item ) {
        if( item.hasOwnProperty(key) ) {
          var value = item[key];
          if (typeof value !== 'undefined') {
            if ( typeof value !== "string" ) {
              value = value.toString();
            }
            if ( value.toLowerCase().indexOf(searchLo) !== -1 ) {
              return true;
            }
          }
        }
      }
      return false;
    });
    this.setState({searchfor: search, displayData: updatedList});
  }

  getMetaArray(instanceNumber) {
    let reducer;
    if (this.isDicomMeta(this.state.fullMetaData)) {
      reducer = this.getDicomTagReducer(this.state.fullMetaData, instanceNumber, '');
    } else {
      reducer = this.getTagReducer(this.state.fullMetaData);
    }
    const keys = Object.keys(this.state.fullMetaData);
    return keys.reduce(reducer, []);
  }

  isDicomMeta(meta) {
    return typeof meta['00020010'] !== 'undefined';
  }

  getTagReducer(tagData) {
    return function (accumulator, currentValue) {
      accumulator.push({
        name: currentValue,
        value: tagData[currentValue].value
      });
      return accumulator;
    };
  }

  getDicomTagReducer(tagData, instanceNumber, prefix) {
    return (accumulator, currentValue) => {
      const tag = getTagFromKey(currentValue);
      let key = tag.getNameFromDictionary();
      if (typeof key === 'undefined') {
        // add 'x' to help sorting
        key = 'x' + tag.getKey();
      }
      const name = key;
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
      // recurse for sequence
      if (element.vr === 'SQ') {
        // sequence tag
        accumulator.push({
          name: (prefix ? prefix + ' ' : '') + name,
          value: ''
        });
        // sequence value
        for (let i = 0; i < value.length; ++i) {
          const sqItems = value[i];
          const keys = Object.keys(sqItems);
          const res = keys.reduce(
            this.getDicomTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'), []
          );
          accumulator = accumulator.concat(res);
        }
      } else {
        // shorten long 'o'ther data
        if (element.vr[0] === 'O' && value.length > 10) {
          value = value.slice(0, 10).toString() + '... (len:' + value.length + ')';
        }
        accumulator.push({
          name: (prefix ? prefix + ' ' : '') + name,
          value: value.toString()
        });
      }
      return accumulator;
    }
  }

  onSliderChange = (event) => {
    const sliderValue = parseInt(event.target.value, 10);
    const instanceNumber = this.state.instanceNumbers[sliderValue];
    const metaArray = this.getMetaArray(instanceNumber);
    this.setState({
      instanceNumber: instanceNumber,
      displayData: metaArray
    });
    this.filterList(this.state.searchfor, instanceNumber);
  }

  onSearch = (event) => {
    var search = event.target.value;
    this.filterList(search, this.state.instanceNumber);
  }

  render() {
    const { displayData, searchfor, sliderMin, sliderMax } = this.state;

    return (
      <Root className={classes.container}>
        <Stack direction="row" spacing={2}>
          <TextField
            id="search"
            type="search"
            value={searchfor}
            className={classes.searchField}
            onChange={this.onSearch}
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
          <Box width={300} display='flex' alignItems="center">
            <Slider
              title="Instance number"
              className={classes.slider}
              marks
              min={sliderMin}
              max={sliderMax}
              onChange={this.onSliderChange}
            />
            <div title="Instante number">{this.state.instanceNumber}</div>
          </Box>
        </Stack>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Tag</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {displayData.map((item, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.value}</TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Root>
    );
  }
}

export default (TagsTable);
