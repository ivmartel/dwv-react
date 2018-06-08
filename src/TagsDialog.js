import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Typography from 'material-ui/Typography';

import Button from '@material-ui/core/Button';
import { InputAdornment } from '@material-ui/core/Input';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/icons/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import Search from '@material-ui/icons/Search';

import Table, { TableBody, TableCell, TableHead, TableRow, TablePagination } from 'material-ui/Table';

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  spacer: {
    flex: '1 1 100%',
  },
  row: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.background.default,
    },
  },
  title: {
    flex: '0 0 auto',
  },
  searchField: {
    backgroundColor: 'white',
  }
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class TagsDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data,
      displayData: this.props.data,
      searchfor: "",
      open: false,
      page: 0,
      rowsPerPage: 10
    };
    
    // bind listener
    this.filterList = this.filterList.bind(this);
  }

  componentWillReceiveProps(nextProps) {
      this.setState({
          data: nextProps.data, 
          displayData: nextProps.data
      });
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  }
  
  filterList(event) {
    var search = event.target.value
    var searchLo = search.toLowerCase();
    var updatedList = this.state.data.filter( function (item) {
      for ( var key in item ) {
          if( item.hasOwnProperty(key) ) {
              var value = item[key];
              if ( typeof value === "number" ) {
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
    this.setState({ rowsPerPage: event.target.value });
  }

  render() {
    const { classes } = this.props;
    const { displayData, searchfor, rowsPerPage, page } = this.state;
    
    return (
      <div>
      <Button variant="raised" color="primary" onClick={this.handleClickOpen}>DICOM Tags</Button>
      <Dialog
          fullScreen
          open={this.state.open}
          onClose={this.handleClose}
          transition={Transition}
        >
          <AppBar className={classes.appBar}>
            <Toolbar>
              <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
              <Typography variant="title" color="inherit" className={classes.flex}>
                DICOM Tags
              </Typography>
            <TextField
              id="search"
              type="search"
              value={searchfor}
              className={classes.searchField}
              onChange={this.filterList}
              margin="normal"
              InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
            />
            </Toolbar>
          </AppBar>
          
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Tag</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {displayData.slice(page * rowsPerPage, 
                page * rowsPerPage + rowsPerPage).map( item => {
            return (
              <TableRow className={classes.row} key={item.group+item.element}>
                <TableCell>{item.name}</TableCell>
                <TableCell numeric>{item.value}</TableCell>
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
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />

      </Dialog>
      </div>
    );
  }
}

TagsDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TagsDialog);
