import React, { useState, createContext } from "react";

export const ComponentsContext = createContext();
 
export const ComponentsContextProvider = (props) => {
  const [components, setComponents] = useState([]); // Renommage de la variable
  const [selectedComponent, setSelectedComponent] = useState(null);

  const addComponent = (component) => {
    setComponents([...components, component]); // Correction du nom de la variable
  };

  return (
    <ComponentsContext.Provider
      value={{
        components, // Correction du nom de la variable
        setComponents, // Correction du nom de la variable
        addComponent,
        selectedComponent,
        setSelectedComponent,
      }}
    >
      {props.children}
    </ComponentsContext.Provider>
  );
};
