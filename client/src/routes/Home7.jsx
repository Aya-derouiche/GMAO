import React, { useState } from 'react';
import Prop_componentList from '../components/Prop_componentList'
import AddProp_component from '../components/AddProp_component'
import './Home.css';

function Home7() {
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

   <Prop_componentList />
   {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
   <AddProp_component hideAddEquipement={toggleAddEquipement} />
   </div>
        </div>
      )}
    </div>
  );
}
export default Home7
