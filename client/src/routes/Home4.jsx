import React, { useState } from 'react';
import ComponentList from '../components/ComponentList'
import AddComponent from '../components/AddComponent'
import './Home.css'; // Import CSS file for styling


function Home4() {
  const [showAddComponent, setShowAddComponent] = useState(false);

  const toggleAddComponent = () => {
    setShowAddComponent(!showAddComponent);
  };
  return (
    <div className="home-container">
    <div className="add-button-container">
      <button className="add-button" onClick={toggleAddComponent}>
        <i className="fas fa-plus"></i>
      </button>
    </div>
  
   <ComponentList />
     
   {showAddComponent && (
        <div className="popup">
          <div className="popup-inner">
            <button onClick={toggleAddComponent} className="close-button">
              <i className="fas fa-times"></i>
            </button>
            <AddComponent hideAddComponent={toggleAddComponent} /> {/* Pass hideAddComponent function */}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home4
