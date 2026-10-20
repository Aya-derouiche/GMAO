import React, { useState, useEffect } from 'react';
import EquipementList from '../components/EquipementList';
import AddEquipement from '../components/AddEquipement';
import './Home.css'; // Import CSS file for styling
import axios from 'axios';

function Home() {
  const [showAddEquipement, setShowAddEquipement] = useState(false);
  const [message, setMessage] = useState('');
  const [auth, setAuth] = useState(false);
  const [role, setRole] = useState('');
  axios.defaults.withCredentials = true;

  const toggleAddEquipement = () => {
    setShowAddEquipement(!showAddEquipement);
  };

  useEffect(() => {
    axios.get('/backend', { withCredentials: true })
      .then(res => {
        if (res.data.status === "Success") {
          setAuth(true);
          setRole(res.data.role);
        } else {
          setAuth(false);
          setMessage(res.data.message);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Failed to fetch data');
      });
  }, []);

  return (
    <div className="home-container">
   <div className="add-button-container">

</div>


        <EquipementList />
        {showAddEquipement && (
  

  
        
            <AddEquipement hideAddEquipement={toggleAddEquipement} />
    
       
      )}
    </div>
  );
}

export default Home;
