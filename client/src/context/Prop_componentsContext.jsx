import React, { useState, createContext } from "react";

export const Prop_componentsContext = createContext();
 
export const Prop_componentsContextProvider = (props) => {
  const [prop_components, setProp_components] = useState([]); // Renommage de la variable
  const [selectedProp_component, setSelectedProp_component] = useState(null);

  const addProp_component = (prop_component) => {
    setProp_components([...prop_components, component]); // Correction du nom de la variable
  };

  return (
    <Prop_componentsContext.Provider
      value={{
        prop_components, // Correction du nom de la variable
        setProp_components, // Correction du nom de la variable
        addProp_component,
        selectedProp_component,
        setSelectedProp_component,
      }}
    >
      {props.children}
    </Prop_componentsContext.Provider>
  );
};
