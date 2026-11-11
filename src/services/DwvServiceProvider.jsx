import { createContext, useContext, useEffect, useState } from 'react';
import { DwvService } from './dwv.service.js';

export const DwvServiceContext = createContext();

export const DwvServiceProvider = ({ children }) => {

  // create the service once: re-renders must not create a new dwv app
  const [dwvService] = useState(() => new DwvService());

  // window listeners follow the provider lifecycle
  useEffect(() => {
    dwvService.connect();
    return () => {
      dwvService.disconnect();
    };
  }, [dwvService]);

  return (
    <DwvServiceContext.Provider value={dwvService}>
      {children}
    </DwvServiceContext.Provider>
  );
};

// Custom hook for easy access
export const useDwvService = () => useContext(DwvServiceContext);
