import React, { useState, useContext, useEffect } from "react";
import Prop_functionFinder from '../apis/Prop_functionFinder';
import { Prop_functionsContext } from '../context/Prop_functionsContext'; 

const AddProp_function = ({ hideAddEquipement }) => {
    const { addProp_function } = useContext(Prop_functionsContext);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [unit, setUnit] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [components, setComponents] = useState([]);
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (refresh) {
            window.location.reload();
            setRefresh(false);
        }
    }, [refresh]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Prop_functionFinder.get("/"); 
                setComponents(response.data.data.components);
                setEquipments(response.data.data.equipments); 
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!name.trim()) {
            errors.name = "Nom obligatoire";
        }

        if (!type.trim()) {
            errors.type = "Type obligatoire";
        }

        if (!unit.trim()) {
            errors.unit = "Unité obligatoire";
        }

        if (!component_id) {
            errors.component_id = "Composant obligatoire";
        }

        if (!equipement_id) {
            errors.equipement_id = "Machine obligatoire";
        }

        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        
        try {
            const response = await Prop_functionFinder.post("/", {
                name, type, unit, component_id, equipement_id
            });
            addProp_function(response.data.data.prop_function);
            clearForm();
            setRefresh(true);

        } catch (err) {
            console.log(err);
        }
    };
  
    const clearForm = () => {
        setName("");
        setType("");
        setUnit("");
        setComponent_id("");
        setEquipement_id("");
        setErrors({});
    };

    return (
        <div className="card">
            <div className="card-body">
                <button onClick={hideAddEquipement} className="close-button">
                    <i className="fas fa-times"></i>
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="col-md-4">
                            <label htmlFor="name">Nom:</label>
                            <input
                                type="text"
                                id="name"
                                className={`form-control ${errors.name && 'is-invalid'}`}
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
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
                            <label htmlFor="component_id">Composant:</label>
                            <select
                                id="component_id"
                                value={component_id}
                                onChange={(e) => setComponent_id(e.target.value)}
                                className={`custom-select ${errors.component_id && 'is-invalid'}`}
                            >
                                <option value="">Select Composant</option>
                                {components.map(component => (
                                    <option key={component.id} value={component.id}>
                                        {component.name}
                                    </option>
                                ))}
                            </select>
                            {errors.component_id && <div className="invalid-feedback">{errors.component_id}</div>}
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="equipement_id">Machine:</label>
                            <select
                                id="equipement_id"
                                value={equipement_id}
                                onChange={(e) => setEquipement_id(e.target.value)}
                                className={`custom-select ${errors.equipement_id && 'is-invalid'}`}
                            >
                                <option value="">Select Machine</option>
                                {equipments.map(equipment => (
                                    <option key={equipment.id} value={equipment.id}>
                                        {equipment.name}
                                    </option>
                                ))}
                            </select>
                            {errors.equipement_id && <div className="invalid-feedback">{errors.equipement_id}</div>}
                        </div>
                        <div className="col-md-4">
                            <button type="submit" className="btn btn-primary">Ajouter</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProp_function;
