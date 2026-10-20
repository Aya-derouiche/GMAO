import React from 'react'
import UpdateEquipement from "../components/UpdateEquipement";
import { Link } from "react-router-dom";

function UpdatePage() {
  return (
    <div className='content-wrapper'>
    <h5 className="text ">
   
                                <Link to="/equipment">Equipement</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                <Link to="">Détails de l'équipement</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                              
    </h5>
    <br></br>
    <UpdateEquipement />
  </div> 
  )
}

export default UpdatePage
