import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState
} from 'react';
import { DwvAppService } from './DwvAppService.js';

export const DwvAppServiceContext = createContext();

/**
 * DWV app service provider: one per viewer. It creates the unique
 *   viewer id (React `useId`) and the viewer `DwvAppService`.
 *
 * @param {object} props The component props.
 * @param {React.ReactNode} props.children The children.
 * @returns {React.ReactElement} The provider element.
 */
export const DwvAppServiceProvider = ({ children }) => {

  // unique per provider and stable across renders
  const viewerId = useId();

  // create the service once: re-renders must not create a new dwv app
  const [dwvAppService] = useState(() => new DwvAppService(viewerId));

  // window listeners follow the provider lifecycle
  useEffect(() => {
    dwvAppService.connect();
    return () => {
      dwvAppService.disconnect();
    };
  }, [dwvAppService]);

  return (
    <DwvAppServiceContext.Provider value={dwvAppService}>
      {children}
    </DwvAppServiceContext.Provider>
  );
};

// Custom hook for easy access
export const useDwvAppService = () => useContext(DwvAppServiceContext);

/**
 * Get a viewer HTML element id builder: `(name) => '<viewerId>-<name>'`.
 *
 * @returns {function(string): string} The element id builder.
 */
export const useElementId = () => {
  const dwvAppService = useDwvAppService();
  return useCallback(
    (name) => dwvAppService.getElementId(name),
    [dwvAppService]
  );
};
