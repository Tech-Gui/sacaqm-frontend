// DataTypeContext.js
import { createContext, useContext, useState } from "react";

const DataTypeContext = createContext();

export const useDataType = () => {
  const context = useContext(DataTypeContext);
  if (!context) {
    throw new Error("useDataType must be used within a DataTypeProvider");
  }
  return context;
};

export const DataTypeProvider = ({ children }) => {
  const [selectedType, setSelectedType] = useState("Pm2p5");

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  return (
    <DataTypeContext.Provider value={{ selectedType, handleTypeSelect }}>
      {children}
    </DataTypeContext.Provider>
  );
};
