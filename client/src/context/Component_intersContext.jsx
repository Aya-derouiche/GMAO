import React, { useState, createContext } from "react";

export const Component_intersContext = createContext();
 
export const Component_intersContextProvider = (props) => {
  const [component_inters, setComponent_inters] = useState([]); // Renommage de la variable
  const [selectedComponent_inter, setSelectedComponent_inter] = useState(null);

  const addComponent_inter = (component_inter) => {
    setComponent_inters([...component_inters, component_inter]); // Correction du nom de la variable
  };

  return (
    <Component_intersContext.Provider
      value={{
        component_inters, // Correction du nom de la variable
        setComponent_inters, // Correction du nom de la variable
        addComponent_inter,
        selectedComponent_inter,
        setSelectedComponent_inter,
      }}
    >
      {props.children}
    </Component_intersContext.Provider>
  );
};
