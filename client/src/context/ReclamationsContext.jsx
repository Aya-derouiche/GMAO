import React, { useState, createContext } from "react";

export const ReclamationsContext = createContext();
 
export const ReclamationsContextProvider = (props) => {
  const [reclamations, setReclamations] = useState([]); // Renommage de la variable
  const [selectedReclamation, setSelectedReclamation] = useState(null);

  const addReclamation = (reclamation) => {
    setReclamations([...reclamations, reclamation]); // Correction du nom de la variable
  };

  return (
    <ReclamationsContext.Provider
      value={{
        reclamations, // Correction du nom de la variable
        setReclamations, // Correction du nom de la variable
        addReclamation,
        selectedReclamation,
        setSelectedReclamation,
      }}
    >
      {props.children}
    </ReclamationsContext.Provider>
  );
};
