import React, { useState } from 'react';
import Calendarplan from '../components/Calendarplan';
function Homecalendar() {

 
    
      return (
        <div className="home-container" style={{ position: 'relative' }}>
         <div className='content-wrapper'>
          <Calendarplan  />
        </div>
        </div>
      );
    }

export default Homecalendar

