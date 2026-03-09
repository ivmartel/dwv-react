import { createContext, useContext } from 'react';
import { DwvService } from './dwv.service.js';

export const DwvServiceContext = createContext();

export const DwvServiceProvider = ({ children }) => {

  const dwvService = new DwvService();

  return (
    <DwvServiceContext.Provider value={dwvService}>
      {children}
    </DwvServiceContext.Provider>
  );
};

// Custom hook for easy access
export const useDwvService = () => useContext(DwvServiceContext);
