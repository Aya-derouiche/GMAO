import React, { useState, createContext } from "react";

export const Prop_equipsContext = createContext();
 
export const Prop_equipsContextProvider = (props) => {
  const [prop_equips, setProp_equips] = useState([]); // Renommage de la variable
  const [selectedProp_equip, setSelectedProp_equip] = useState(null);

  const addProp_equip = (prop_equip) => {
    setProp_equips([...prop_equips, prop_equip]); // Correction du nom de la variable
  };

  return (
    <Prop_equipsContext.Provider
      value={{
        prop_equips, // Correction du nom de la variable
        setProp_equips, // Correction du nom de la variable
        addProp_equip,
        selectedProp_equip,
        setSelectedProp_equip,
      }}
    >
      {props.children}
    </Prop_equipsContext.Provider>
  );
};
