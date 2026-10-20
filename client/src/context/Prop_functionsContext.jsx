import React, { useState, createContext } from "react";

export const Prop_functionsContext = createContext();
 
export const Prop_functionsContextProvider = (props) => {
  const [prop_functions, setProp_functions] = useState([]); // Renommage de la variable
  const [selectedProp_function, setSelectedProp_function] = useState(null);

  const addProp_function = (prop_function) => {
    setProp_functions([...prop_functions, prop_function]); // Correction du nom de la variable
  };

  return (
    <Prop_functionsContext.Provider
      value={{
        prop_functions, // Correction du nom de la variable
        setProp_functions, // Correction du nom de la variable
        addProp_function,
        selectedProp_function,
        setSelectedProp_function,
      }}
    >
      {props.children}
    </Prop_functionsContext.Provider>
  );
};
