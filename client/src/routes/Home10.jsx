import React, { useState } from 'react';
import Affectation_interList from '../components/Affectation_interList'
import AddAffectation_inter from '../components/AddAffectation_inter'
import './Home.css';

function Home10() {

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
   <Affectation_interList />
   {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
   <AddAffectation_inter hideAddEquipement={toggleAddEquipement} />
   </div>
        </div>
      )}
    </div>
  );
}
export default Home10
