import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore
} from 'react';

import { useDwvAppService } from './DwvAppServiceProvider.jsx';
import { AnnotationService } from './AnnotationService.js';

export const AnnotationServiceContext = createContext();

/**
 * Annotation service provider: to use inside a `DwvAppServiceProvider`.
 *   The service lives with the provider so that the annotation state
 *   is kept when the annotation component is unmounted
 *   (for ex when the right panel is closed).
 * @param {object} props The component props.
 * @param {React.ReactNode} props.children The children.
 * @returns {React.ReactElement} The provider element.
 */
export const AnnotationServiceProvider = ({ children }) => {

  const dwvAppService = useDwvAppService();

  // create the service once
  const [annotationService] = useState(
    () => new AnnotationService(dwvAppService)
  );

  // dwv listeners follow the provider lifecycle
  useEffect(() => {
    annotationService.connect();
    return () => {
      annotationService.dispose();
    };
  }, [annotationService]);

  return (
    <AnnotationServiceContext.Provider value={annotationService}>
      {children}
    </AnnotationServiceContext.Provider>
  );
};

// Custom hook for easy access
export const useAnnotationService = () => useContext(AnnotationServiceContext);

/**
 * Get the annotation service state, re-render on change.
 * @returns {import('./AnnotationService.js').AnnotationState} The state.
 */
export const useAnnotationState = () => {
  const annotationService = useAnnotationService();
  return useSyncExternalStore(
    annotationService.subscribe,
    annotationService.getSnapshot
  );
};
