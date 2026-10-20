import React, { useState } from 'react';
import Prop_functionList from '../components/Prop_functionList'
import AddProp_function from '../components/AddProp_function'
import './Home.css';

function Home6() {
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
   <Prop_functionList />
   {showAddEquipement && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddEquipement} className="close-button">
              <i className="fas fa-times"></i>
            </button>
   <AddProp_function hideAddEquipement={toggleAddEquipement} />
     
   </div>
        </div>
      )}
    </div>
  );
}

export default Home6
