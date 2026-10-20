import React, { useState, createContext } from "react";

export const EquipementsContext = createContext();

export const EquipementsContextProvider = (props) => {
  const [equipements, setEquipements] = useState([]);
  const [selectedEquipement, setSelectedEquipement] = useState(null);


  const addEquipements = (equipement) => {
    setEquipements([...equipements, equipement]);
  };
  return (
    <EquipementsContext.Provider
      value={{
        equipements,
        setEquipements,
        addEquipements,
        selectedEquipement,
        setSelectedEquipement,

       
      }}
    >
      {props.children}
    </EquipementsContext.Provider>
  );
};
