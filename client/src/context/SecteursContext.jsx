import React, { useState, createContext } from "react";

export const SecteursContext = createContext();
 
export const SecteursContextProvider = (props) => {
  const [secteurs, setSecteurs] = useState([]); // Renommage de la variable
  const [selectedSecteur, setSelectedSecteur] = useState(null);

  const addSecteur = (secteur) => {
    setSecteurs([...secteurs, secteur]); // Correction du nom de la variable
  };

  return (
    <SecteursContext.Provider
      value={{
        secteurs, // Correction du nom de la variable
        setSecteurs, // Correction du nom de la variable
        addSecteur,
        selectedSecteur,
        setSelectedSecteur,
      }}
    >
      {props.children}
    </SecteursContext.Provider>
  );
};
