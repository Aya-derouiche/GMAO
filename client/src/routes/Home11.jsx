import React, { useState } from 'react';
import Component_interList from '../components/Component_interList'
import AddComponent_inter from '../components/AddComponent_inter'
import './Home.css';

function Home11() {
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
   <Component_interList />
   {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
   <AddComponent_inter hideAddEquipement={toggleAddEquipement} />
   
   </div>
        </div>
      )}
    </div>
  );
}
export default Home11
