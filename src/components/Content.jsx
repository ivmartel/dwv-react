import {
  useState,
  useEffect,
} from 'react';
import { styled } from '@mui/material/styles';

import { useDwvService } from '../services/DwvServiceProvider.jsx';

import './Content.css';

const Root = styled('div')();

const Content = () => {

  const dwvService = useDwvService();

  const [loadProgress, setLoadProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  const dropboxDivId = 'dropBox';
  const dropboxClassName = 'dropBox';
  const borderClassName = 'dropBoxBorder';
  const hoverClassName = 'hover';

  useEffect(() => {
    const handleLoadProgress = (event) => {
      const progress = event.detail.value;
      setLoadProgress(progress);
      autoShowDropbox(dataLoaded, progress);
    };
    const handleDataLoaded = (event) => {
      const isLoaded = event.detail.value;
      setDataLoaded(isLoaded);
      autoShowDropbox(isLoaded, loadProgress);
    };

    // subscribe
    dwvService.addEventListener('loadprogress', handleLoadProgress);
    dwvService.addEventListener('dataloaded', handleDataLoaded);

    // cleanup
    return () => {
      dwvService.removeEventListener('loadprogress', handleLoadProgress);
      dwvService.removeEventListener('dataloaded', handleDataLoaded);
    };
  }, [dwvService]);

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Default drag event handling.
   * @param {DragEvent} event The event to handle.
   */
  const defaultHandleDragEvent = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragOver = (event) => {
    defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(dropboxDivId);
    if (box && box.className.indexOf(hoverClassName) === -1) {
        box.className += ' ' + hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragLeave = (event) => {
    defaultHandleDragEvent(event);
    // update box class
    const box = document.getElementById(dropboxDivId);
    if (box && box.className.indexOf(hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param {DragEvent} event The event to handle.
   */
  const onDrop = (event) => {
    defaultHandleDragEvent(event);
    // load files
    dwvService.loadFiles(event.dataTransfer.files);
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  const onInputFile = (event) => {
    if (event.target && event.target.files) {
      dwvService.loadFiles(event.target.files);
    }
  }

  /**
   * Show the dropbox according to state.
   */
  const autoShowDropbox = (isLoaded, progress) => {
    const isLoading = progress !== 0 && progress !== 100;
    showDropbox(!isLoading && !isLoaded);
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  const showDropbox = (show) => {
    const box = document.getElementById(dropboxDivId);
    if (!box) {
      return;
    }
    const layerDiv = document.getElementById('layerGroup0');

    if (show) {
      // reset css class
      box.className = dropboxClassName + ' ' + borderClassName;
      // show box
      box.setAttribute('style', 'display:initial');
      // stop layer listening
      if (layerDiv) {
        layerDiv.removeEventListener('dragover', defaultHandleDragEvent);
        layerDiv.removeEventListener('dragleave', defaultHandleDragEvent);
        layerDiv.removeEventListener('drop', onDrop);
      }
      // listen to box events
      box.addEventListener('dragover', onBoxDragOver);
      box.addEventListener('dragleave', onBoxDragLeave);
      box.addEventListener('drop', onDrop);
    } else {
      // remove border css class
      box.className = dropboxClassName;
      // hide box
      box.setAttribute('style', 'display:none');
      // stop box listening
      box.removeEventListener('dragover', onBoxDragOver);
      box.removeEventListener('dragleave', onBoxDragLeave);
      box.removeEventListener('drop', onDrop);
      // listen to layer events
      if (layerDiv) {
        layerDiv.addEventListener('dragover', defaultHandleDragEvent);
        layerDiv.addEventListener('dragleave', defaultHandleDragEvent);
        layerDiv.addEventListener('drop', onDrop);
      }
    }
  }

  // drag and drop [end] -------------------------------------------------------

  return (
    <Root className="content">
      <div id="layerGroup0" className="layerGroup">
        <div id="dropBox"
          className="dropBox dropBoxBorder"
          onDragOver={onBoxDragOver}
          onDragLeave={onBoxDragLeave}
          onDrop={onDrop}
          >
          <p>Drag and drop data here or
            <label htmlFor="input-file">
              <a id="input-file-link"> click here</a>
              <input
                id="input-file"
                type="file"
                multiple
                onChange={onInputFile}
                style={{display: "none"}}/>
            </label>
          </p>
        </div>
      </div>
    </Root>
  );

} // Content

export default (Content);
