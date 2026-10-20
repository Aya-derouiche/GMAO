import React, { useState, createContext } from "react";

export const InterventionsContext = createContext();
 
export const InterventionsContextProvider = (props) => {
  const [interventions, setInterventions] = useState([]); // Renommage de la variable
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const addIntervention= (intervention) => {
    setInterventions([...interventions, intervention]); // Correction du nom de la variable
  };

  return (
    <InterventionsContext.Provider
      value={{
        interventions, // Correction du nom de la variable
        setInterventions, // Correction du nom de la variable
        addIntervention,
        selectedIntervention,
        setSelectedIntervention,
      }}
    >
      {props.children}
    </InterventionsContext.Provider>
  );
};
