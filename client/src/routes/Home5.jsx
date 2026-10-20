import React, { useState } from 'react';
import Prop_equipList from '../components/Prop_equipList';
import AddProp_equip from '../components/AddProp_equip';
import './Home.css';

function Home5() {
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
      <Prop_equipList />
      {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
            <AddProp_equip hideAddEquipement={toggleAddEquipement} />
            
          </div>
        </div>
      )}
    </div>
  );
}

export default Home5;
 