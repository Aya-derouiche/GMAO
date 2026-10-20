import React, { useState, useContext, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import Prop_functionFinder from '../apis/Prop_functionFinder';
import EquipementFinder from '../apis/EquipementFinder';
import { Prop_functionsContext } from '../context/Prop_functionsContext'; 

const AddProp_function2 = () => {
    const { name, equipment_id } = useParams();
    const { addProp_function } = useContext(Prop_functionsContext);

    const [nameinput, setNameinput] = useState(`FUNC ${name}`); // Initializing with FUNC + name
    const [type, setType] = useState("");
    const [unit, setUnit] = useState("");
    const [components, setComponents] = useState([]);
    const [component_id, setComponent_id] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [errors, setErrors] = useState({});
    const [equipement, setEquipement] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Prop_functionFinder.get("/");
                setComponents(response.data.data.components);

                const equipementResponse = await EquipementFinder.get(`/`);
                const equipementData = equipementResponse.data.data.equipement;
                setEquipement(equipementData);

            } catch (err) {
                console.log(err);
            }
        };
        
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        
        if (!nameinput.trim()) {
            errors.nameinput = "Nom obligatoire";
        }
        
        if (!type.trim()) {
            errors.type = "Type obligatoire";
        }
        
        if (!unit.trim()) {
            errors.unit = "Unité obligatoire";
        }
        
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
            
        try {
            const response = await axios.post(`http://localhost:3001/api/v1/ReadEquipement/AddProp_function2/${equipment_id}`, {
                nameinput,
                type,
                unit,
                component_id,
                equipement_id: equipment_id // Use the passed equipment_id here
            });
            addProp_function(response.data.data.prop_function);
            clearForm();
            setRefresh(true);
            window.location.href = 'http://localhost:5173/prop_function';
        } catch (err) {
            console.log(err);
        }
    };
    
    
    const clearForm = () => {
        setNameinput(``);
        setType("");
        setUnit("");
        setComponent_id(null);
        setErrors({});
    };

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title">
                            <Link to="/equipment">Equipement</Link>
                            <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                            <Link to={`/equipment/ReadEquipement/${name}`}>Détail de l'équipement " {name} "</Link>
                            <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                            Ajouter propriété de fonctionnement
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
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-12 col-sm-6">
                                    <div className="equipment-info card">
                                        <div className="card-body">
                                            <div className="form-row">
                                                <div className="col-md-4">
                                                    <label htmlFor="nameinput">Nom:</label>
                                                    <input
                                                        type="text"
                                                        id="nameinput"
                                                        className={`form-control ${errors.nameinput && 'is-invalid'}`}
                                                        placeholder="Name"
                                                        value={nameinput}
                                                        onChange={(e) => setNameinput(e.target.value)}
                                                        disabled // Making the field disabled
                                                    />
                                                    {errors.nameinput && <div className="invalid-feedback">{errors.nameinput}</div>}
                                                </div>
                                                <div className="col-md-4">
                                                    <label htmlFor="type">Type:</label>
                                                    <input
                                                        type="text"
                                                        id="type"
                                                        className={`form-control ${errors.type && 'is-invalid'}`}
                                                        placeholder="Type"
                                                        value={type}
                                                        onChange={(e) => setType(e.target.value)}
                                                    />
                                                    {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                                                </div>
                                                <div className="col-md-4">
                                                    <label htmlFor="unit">Unité:</label>
                                                    <input
                                                        type="text"
                                                        id="unit"
                                                        className={`form-control ${errors.unit && 'is-invalid'}`}
                                                        placeholder="Unit"
                                                        value={unit}
                                                        onChange={(e) => setUnit(e.target.value)}
                                                    />
                                                    {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="col-md-4">
                                                    <button type="submit" className="btn btn-primary">Ajouter</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default AddProp_function2;
