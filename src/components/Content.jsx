import {
  useState,
  useEffect,
} from 'react';
import { styled } from '@mui/material/styles';

import { useDwvAppService } from '../services/DwvAppServiceProvider.jsx';

import './Content.css';

const Root = styled('div')();

/**
 * Prevent the browser default drag handling (i.e. opening the file).
 * @param {DragEvent} event The event to handle.
 */
const preventDefaultDrag = (event) => {
  event.stopPropagation();
  event.preventDefault();
};

const Content = () => {

  const dwvAppService = useDwvAppService();

  const [loadProgress, setLoadProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isDragHover, setIsDragHover] = useState(false);

  useEffect(() => {
    const handleLoadProgress = (event) => {
      setLoadProgress(event.detail.value);
    };
    const handleDataLoaded = (event) => {
      setDataLoaded(event.detail.value);
    };

    // subscribe
    dwvAppService.addEventListener('loadprogress', handleLoadProgress);
    dwvAppService.addEventListener('dataloaded', handleDataLoaded);

    // cleanup
    return () => {
      dwvAppService.removeEventListener('loadprogress', handleLoadProgress);
      dwvAppService.removeEventListener('dataloaded', handleDataLoaded);
    };
  }, [dwvAppService]);

  // the drop box is shown when not loading and no data is loaded
  const isLoading = loadProgress !== 0 && loadProgress !== 100;
  const showDropbox = !isLoading && !dataLoaded;

  /**
   * Handle a drag over the drop box.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragOver = (event) => {
    preventDefaultDrag(event);
    setIsDragHover(true);
  };

  /**
   * Handle a drag leave of the drop box.
   * @param {DragEvent} event The event to handle.
   */
  const onBoxDragLeave = (event) => {
    preventDefaultDrag(event);
    setIsDragHover(false);
  };

  /**
   * Handle a drop: on the drop box or on the layer group
   * (to replace already loaded data).
   * @param {DragEvent} event The event to handle.
   */
  const onDrop = (event) => {
    preventDefaultDrag(event);
    setIsDragHover(false);
    dwvAppService.loadFiles(event.dataTransfer.files);
  };

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  const onInputFile = (event) => {
    if (event.target && event.target.files) {
      dwvAppService.loadFiles(event.target.files);
    }
  };

  const boxClassName = 'dropBox dropBoxBorder' + (isDragHover ? ' hover' : '');

  return (
    <Root className="content">
      <div id="layerGroup0" className="layerGroup"
        onDragOver={preventDefaultDrag}
        onDragLeave={preventDefaultDrag}
        onDrop={onDrop}
        >
        <div id="dropBox"
          className={boxClassName}
          style={{display: showDropbox ? 'initial' : 'none'}}
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
