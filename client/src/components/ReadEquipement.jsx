import React, { useEffect, useState, useContext } from "react";
import EquipementFinder from '../apis/EquipementFinder';
import { EquipementsContext } from '../context/EquipementsContext';
import { useParams, Link, useNavigate  } from "react-router-dom";
import axios from "axios";
import AddProp_function2 from './AddProp_function2'; // Import the AddProp_function2 component
import './ReadEquip.css';

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const ReadEquipement = () => {
    const [equipement, setEquipement] = useState(null);
    const [propFunctionInfo, setPropFunctionInfo] = useState(null); 
    const [propEquipInfo, setPropEquipInfo] = useState(null); 
    const navigate = useNavigate();

    const { name } = useParams();
    const { equipements, setEquipements } = useContext(EquipementsContext);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const equipementResponse = await EquipementFinder.get(`/equipementName/${name}`);
                const equipementData = equipementResponse.data.data.equipement;
                setEquipement(equipementData);

                const propFunctionResponse = await axios.get(`http://localhost:3001/api/v1/equipement/${name}/prop_function`);
                if (propFunctionResponse.data.status === 'success' && propFunctionResponse.data.data.prop_function.length > 0) {
                    setPropFunctionInfo(propFunctionResponse.data.data.prop_function[0]);
                } else {
                    setPropFunctionInfo(null);
                }
                const propEquipResponse = await axios.get(`http://localhost:3001/api/v1/equipement/${name}/prop_equip`);
                if (propEquipResponse.data.status === 'success' && propEquipResponse.data.data.prop_equip.length > 0) {
                    setPropEquipInfo(propEquipResponse.data.data.prop_equip[0]);
                } else {
                    setPropEquipInfo(null);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [name]);

    const handleAddFunction = (e, name, equipment_id) => {
        e.stopPropagation();
        navigate(`/ReadEquipement/${name}/AddProp_function2/${equipment_id}`);
    };
    
    return (
        <div className="content-wrapper">
            <section className="content">
                {equipement && (
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title">
                                <Link to="/equipment">Equipement</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                <Link to="">Détails de l'équipement</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                {name}
                            </h5>
                            <div className="card-tools">
                                <button type="button" className="btn btn-tool" data-card-widget="collapse" title="Collapse">
                                    <i className="fas fa-minus"></i>
                                </button>
                                <button type="button" className="btn btn-tool" data-card-widget="remove" title="Remove">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-12 col-sm-6">
                                    <div className="equipement-info card">
                                        <div className="card-body">
                                            <h4><b>{equipement.name}</b></h4>
                                            <hr />
                                            <div className="img-container">
                                                {equipement.image && (
                                                    <img 
                                                        title={equipement.name} 
                                                        src={`http://localhost:3001/${equipement.image}`} 
                                                        alt={equipement.name} 
                                                        className="card-img-top" 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="equipement-content card">
                                        <div className="card-body">
                                            <div className="equipement-details">
                                                <p><strong>Emplacement:</strong> {equipement.location}</p>
                                                <p><strong>Modèle:</strong> {equipement.model}</p>
                                                <p><strong>Numéro de série:</strong> {equipement.serial_number}</p>
                                                <p><strong>Statut:</strong> {equipement.status}</p>
                                                <p><strong>Description:</strong> {equipement.description}</p>
                                                <p><strong>Date d'ajout:</strong> {formatDate(equipement.add_date)}</p>
                                                {equipement.warranty_expiration_date && (
                                                    <p><strong>Date d'expiration de la garantie:</strong> {formatDate(equipement.warranty_expiration_date)}</p>
                                                )}
                                                <p><strong>Coût:</strong> {equipement.cost}</p>
                                                <p><strong>Secteur:</strong> {equipement.secteur_name}</p>
                                                <p><strong>{propFunctionInfo ? 'Propriété de fonctionnement:' : 'Ajouter propriété:'}</strong></p>
                                                {propFunctionInfo && (
                                                    <div>
                                                        <p><strong>Nom:</strong> {propFunctionInfo.name}</p>
                                                        <p><strong>Type:</strong> {propFunctionInfo.type}</p>
                                                        <p><strong>Unité:</strong> {propFunctionInfo.unit}</p>
                                                    </div>
                                                )}
                                                {!propFunctionInfo && (
                                                    <button className="btn btn-info" onClick={(e) => handleAddFunction(e, equipement.name, equipement.id)}>
                                                        Ajouter propriété de fonctionnement
                                                    </button>
                                                )}

                                                {propEquipInfo && (
                                                    <div>
                                                        <p><strong>Current value :</strong> {propEquipInfo.current_value}</p>
                                                        <p><strong>Cycle :</strong> {propEquipInfo.cycle}</p>
                                                        <p><strong>dernier valeur de maintenance:</strong> {propEquipInfo.last_maint_value}</p>
                                                        <p><strong>Dernier date de maintenance :</strong> {formatDate(propEquipInfo.last_maint_date)}</p>
                                                        <p><strong>description :</strong> {propEquipInfo.description}</p>
                                                    </div>
                                                )}
                                                &nbsp;
                                                {!propEquipInfo && (
                                                    <button className="btn btn-info" onClick={() => window.location.href = "http://localhost:5173/prop_equip"}>
                                                        Ajouter propriété equipement
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
            {/* Pass the equipementId as a prop to AddProp_function2 */}
        </div>
    );
};

export default ReadEquipement;
