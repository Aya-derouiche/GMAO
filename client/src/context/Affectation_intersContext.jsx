import React, { useState, createContext } from "react";

export const Affectation_intersContext = createContext();
 
export const Affectation_intersContextProvider = (props) => {
  const [affectation_inters, setAffectation_inters] = useState([]); // Renommage de la variable
  const [selectedAffectation_inter, setSelectedAffectation_inter] = useState(null);

  const addAffectation_inter = (affectation_inter) => {
    setAffectation_inters([...affectation_inters, affectation_inter]); // Correction du nom de la variable
  };

  return (
    <Affectation_intersContext.Provider
      value={{
        affectation_inters, // Correction du nom de la variable
        setAffectation_inters, // Correction du nom de la variable
        addAffectation_inter,
        selectedAffectation_inter,
        setSelectedAffectation_inter,
      }}
    >
      {props.children}
    </Affectation_intersContext.Provider>
  );
};
