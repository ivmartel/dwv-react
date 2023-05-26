import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import Search from '@mui/icons-material/Search';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

const styles = theme => ({
  flex: {
    flex: 1,
  },
  spacer: {
    flex: '1 1 100%',
  },
  searchField: {
    width: "45%"
  },
  slider: {
    margin: 20
  },
  container: {
    paddingLeft: 10,
    paddingTop: 20
  }
});

class TagsTable extends React.Component {

  constructor(props) {
    super(props);

    const fullMetaData = this.props.data;

    // store keys (to not recreate them)
    //this.keys = Object.keys(this.props.data);
    // set slider with instance numbers ('00200013')
    let instanceNumbers = fullMetaData['InstanceNumber'].value;
    if (typeof instanceNumbers === 'string') {
      instanceNumbers = [instanceNumbers];
    }
    // convert string to numbers
    const numbers = instanceNumbers.map(Number);
    numbers.sort((a, b) => a - b);
    // store
    // this.min = numbers[0];
    // this.max = numbers[numbers.length - 1];

    this.state = {
      fullMetaData: fullMetaData,
      searchfor: "",
      page: 0,
      rowsPerPage: 10,
      sliderMin: numbers[0],
      sliderMax: numbers[numbers.length - 1],
      instanceNumber: numbers[0]
    };
    this.state.displayData = this.getMetaArray(numbers[0]);

    // bind listener
    this.filterList = this.filterList.bind(this);
  }

  filterList(search) {
    var searchLo = search.toLowerCase();
    var metaArray = this.getMetaArray(this.state.instanceNumber);
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
    const reducer = this.getTagReducer(this.state.fullMetaData, instanceNumber, '');
    const keys = Object.keys(this.state.fullMetaData);
    return keys.reduce(reducer, []);
  }

  getTagReducer(tagData, instanceNumber, prefix) {
    return (accumulator, currentValue) => {
      let name = currentValue;
      const element = tagData[currentValue];
      let value = element.value;
      // possible 'merged' object
      if (typeof value[instanceNumber] !== 'undefined') {
        value = value[instanceNumber].value;
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
            this.getTagReducer(sqItems, instanceNumber, prefix + '[' + i + ']'), []
          );
          accumulator = accumulator.concat(res);
        }
      } else {
        accumulator.push({
          name: (prefix ? prefix + ' ' : '') + name,
          value: value
        });
      }
      return accumulator;
    }
  }

  onSliderChange = (event) => {
    const sliderValue = parseInt(event.target.value, 10);
    const metaArray = this.getMetaArray(sliderValue);
    this.setState({
      instanceNumber: sliderValue,
      displayData: metaArray
    });
    this.filterList(this.state.searchfor);
  }

  onSearch = (event) => {
    var search = event.target.value;
    this.filterList(search);
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  }

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  }

  render() {
    const { classes } = this.props;
    const { displayData, searchfor, rowsPerPage, page, sliderMin, sliderMax } = this.state;

    return (
      <div className={classes.container}>
        <Stack direction="row" spacing={2}>
          <TextField
            id="search"
            type="search"
            value={searchfor}
            className={classes.searchField}
            onChange={this.onSearch}
            margin="normal"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
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

        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Tag</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {displayData.slice(page * rowsPerPage,
                page * rowsPerPage + rowsPerPage).map((item, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.value}</TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={displayData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onPageChange={this.handleChangePage}
          onRowsPerPageChange={this.handleChangeRowsPerPage}
        />

      </div>
    );
  }
}

TagsTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TagsTable);
