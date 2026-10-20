import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Component_interFinder from "../apis/Component_interFinder";

const UpdateComponent_inter = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [repair_change, setRepair_change] = useState("");
    const [last_values, setLast_values] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [intervention_id, setIntervention_id] = useState("");
    const [components, setComponents] = useState([]);
    const [interventions, setInterventions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Component_interFinder.get(`/${id}`);
                const componentInterData = response.data.data.component_inter;
                setRepair_change(componentInterData.repair_change);
                setLast_values(componentInterData.last_values);
                setComponent_id(componentInterData.component_id);
                setIntervention_id(componentInterData.intervention_id);

                // Fetch list of components and interventions to populate the dropdowns
                const componentsResponse = await Component_interFinder.get("/components");
                setComponents(componentsResponse.data.data.components);

                const interventionsResponse = await Component_interFinder.get("/interventions");
                setInterventions(interventionsResponse.data.data.interventions);

            } catch (error) {
                console.error("Error fetching component inter:", error);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Component_interFinder.put(`/${id}`, {
                repair_change,
                last_values,
                component_id,
                intervention_id
            });
            navigate('/component_inter'); // Redirect to the component_inter page after updating
        } catch (error) {
            console.error("Error updating component inter:", error);
        }
    };

    return (
        <div className="content-wrapper">
    <div className="content-header">
        <div className="card">
            <div className="card-header">
                <button onClick={() => navigate('/component_inter')} className="btn btn-sm btn-danger float-right">Fermer</button>
            </div>
            <div className="card-body">
                <form>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="repair_change">Changement de réparation</label>
                                <input
                                    value={repair_change}
                                    onChange={(e) => setRepair_change(e.target.value)}
                                    id="repair_change"
                                    className="form-control"
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="last_values">Dernières valeurs</label>
                                <input
                                    value={last_values}
                                    onChange={(e) => setLast_values(e.target.value)}
                                    id="last_values"
                                    className="form-control"
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="component_id">Composant</label>
                                <select
                                    value={component_id}
                                    onChange={(e) => setComponent_id(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Sélectionner un composant</option>
                                    {components.map(component => (
                                        <option key={component.id} value={component.id}>
                                            {component.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="intervention_id">Intervention</label>
                                <select
                                    value={intervention_id}
                                    onChange={(e) => setIntervention_id(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Sélectionner une intervention</option>
                                    {interventions.map(intervention => (
                                        <option key={intervention.id} value={intervention.id}>
                                            {intervention.ref}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="btn btn-primary"
                            >
                                Soumettre
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
);
};

export default UpdateComponent_inter;
