import React, { useState, useContext, useEffect } from "react";
import Component_interFinder from '../apis/Component_interFinder';
import { Component_intersContext } from '../context/Component_intersContext'; 

const AddComponent_inter = ({ hideAddEquipement }) => {
    const { addComponent_inter } = useContext(Component_intersContext);
    const [repair_change, setRepair_change] = useState("");
    const [last_values, setLast_values] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [intervention_id, setIntervention_id] = useState("");
    const [components, setComponents] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [refresh, setRefresh] = useState(false);
    
    useEffect(() => {
        if (refresh) {
            // Reload the page after adding an affectation inter
            window.location.reload();
            // Reset the refresh state to prevent continuous refresh
            setRefresh(false);
        }
    }, [refresh]);
  
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Component_interFinder.get("/"); // Fetch data from backend
                setComponents(response.data.data.components); 
                setInterventions(response.data.data.interventions);// Update techniciens and interventions state
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await Component_interFinder.post("/", {
                repair_change: repair_change,
                last_values: last_values,
                component_id: component_id,
                intervention_id: intervention_id
            });
            addComponent_inter(response.data.data.component_inter);
            clearForm();
            setRefresh(true); // Trigger page refresh after adding the affectation inter

        } catch (err) {
            console.log(err);
        }
    };
  
    const clearForm = () => {
        setRepair_change("");
        setLast_values("");
        setComponent_id("");
        setIntervention_id("");
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card">
                        <div className="card-body">
                            <button onClick={hideAddEquipement} className="close-button">
                                <i className="fas fa-times"></i>
                            </button>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="repair_change">réparer changer</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Repair Change"
                                        value={repair_change}
                                        onChange={(e) => setRepair_change(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="last_values">Dernier valeur</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Last Values"
                                        value={last_values}
                                        onChange={(e) => setLast_values(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="component_id">Composant</label>
                                    <select
                                        value={component_id}
                                        onChange={(e) => setComponent_id(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="">Selectioner un composant</option>
                                        {components.map(component => (
                                            <option key={component.id} value={component.id}>
                                                {component.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="intervention_id">Intervention</label>
                                    <select
                                        value={intervention_id}
                                        onChange={(e) => setIntervention_id(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="">Select Intervention</option>
                                        {interventions.map(intervention => (
                                            <option key={intervention.id} value={intervention.id}>
                                                {intervention.ref}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary">ADD</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddComponent_inter;
