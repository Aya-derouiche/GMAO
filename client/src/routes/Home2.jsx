import React, { useState } from 'react';
import EmployeeList from '../components/EmployeeList';
import AddEmployee from '../components/AddEmployee'; // Import the AddEmployee component
import './Home.css'; // Import CSS file for styling

function Home2() {

  return (
    <div className="home-container" style={{ position: 'relative' }}>
     
      <EmployeeList />
    </div>
  );
}

export default Home2;
