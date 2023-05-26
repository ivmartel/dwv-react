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

const styles = theme => ({
  flex: {
    flex: 1,
  },
  spacer: {
    flex: '1 1 100%',
  },
  searchField: {
    marginLeft: 20
  },
  container: {
    paddingLeft: 10,
    paddingTop: 20
  }
});

class TagsTable extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data,
      displayData: this.props.data,
      searchfor: "",
      page: 0,
      rowsPerPage: 10
    };

    // bind listener
    this.filterList = this.filterList.bind(this);
  }

  filterList(event) {
    var search = event.target.value
    var searchLo = search.toLowerCase();
    var updatedList = this.state.data.filter( function (item) {
      for ( var key in item ) {
        if( item.hasOwnProperty(key) ) {
          var value = item[key];
          if ( typeof value !== "string" ) {
            value = value.toString();
          }
          if ( value.toLowerCase().indexOf(searchLo) !== -1 ) {
            return true;
          }
        }
      }
      return false;
    });
    this.setState({searchfor: search, displayData: updatedList});
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  }

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  }

  render() {
    const { classes } = this.props;
    const { displayData, searchfor, rowsPerPage, page } = this.state;

    return (
      <div className={classes.container}>
        <TextField
          id="search"
          type="search"
          value={searchfor}
          className={classes.searchField}
          onChange={this.filterList}
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
                <TableCell>{item.value.toString()}</TableCell>
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
