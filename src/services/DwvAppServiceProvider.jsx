import { createContext, useContext, useEffect, useState } from 'react';
import { DwvAppService } from './DwvAppService.js';

export const DwvAppServiceContext = createContext();

export const DwvAppServiceProvider = ({ children }) => {

  // create the service once: re-renders must not create a new dwv app
  const [dwvAppService] = useState(() => new DwvAppService());

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
