import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EquipementFinder from '../apis/EquipementFinder';

const ReadEquip = () => {
  const { id } = useParams();
  const [equipement, setEquipement] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await EquipementFinder.get(`/${id}`);
        setEquipement(response.data.data.equipement);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            {/* Contenu facultatif de l'en-tête */}
          </div>
          <div className="row">
            <div className="col">
              {equipement && (
                <div className="card">
                  <div className="card-header">
                    <h3>{equipement.name}</h3>
                  </div>
                  <div className="card-body">
                    <p><strong>Location:</strong> {equipement.location}</p>
                    <p><strong>Model:</strong> {equipement.model}</p>
                    <p><strong>Serial Number:</strong> {equipement.serial_number}</p>
                    <p><strong>Status:</strong> {equipement.status}</p>
                    <p><strong>Description:</strong> {equipement.description}</p>
                    <p><strong>Warranty Expiration Date:</strong> {equipement.warranty_expiration_date}</p>
                    <p><strong>Cost:</strong> {equipement.cost}</p>
                    <p><strong>Secteur:</strong> {equipement.secteur_name}</p>
                    <p><strong>Image:</strong> {equipement.image}</p>
                    {equipement.image && (
                      <img src={`http://localhost:3001/${equipement.image}`} alt={equipement.name} />
                    )}
                  </div>
                  <div className="card-footer">
                    <Link to={`/equipements/${id}/update`} className="btn btn-primary mr-2">Edit</Link>
                    <Link to="/equipements" className="btn btn-secondary">Back</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadEquip;
