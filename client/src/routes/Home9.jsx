import React, { useState } from 'react';
import InterventionList from '../components/InterventionList'
import AddIntervention from '../components/AddIntervention'
import './Home.css';

function Home9() {
  const [showAddEquipement, setShowAddEquipement] = useState(false);

  const toggleAddEquipement = () => {
    setShowAddEquipement(!showAddEquipement);
  };

  return (
    <div className="home-container">
    <div className="add-button-container">
      <button className="add-button" onClick={toggleAddEquipement}>
        <i className="fas fa-plus"></i>
      </button>
    </div>
   <InterventionList />
   {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
   <AddIntervention hideAddEquipement={toggleAddEquipement} />
      
   </div>
        </div>
      )}
    </div>
  );
}
export default Home9
