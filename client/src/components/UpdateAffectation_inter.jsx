import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Affectation_interFinder from "../apis/Affectation_interFinder";

const UpdateAffectation_inter = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [duration, setDuration] = useState("");
    const [report, setReport] = useState("");
    const [technicien_id, setTechnicien_id] = useState("");
    const [intervention_id, setIntervention_id] = useState("");
    const [techniciens, setTechniciens] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [errors, setErrors] = useState({
        duration: "",
        report: "",
        technicien_id: "",
        intervention_id: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Affectation_interFinder.get("/"); // Fetch data from backend
                setTechniciens(response.data.data.techniciens); 
                setInterventions(response.data.data.interventions);// Update techniciens and interventions state
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Affectation_interFinder.get(`/${id}`);
                const affectationInterData = response.data.data.affectation_inter;
                setDuration(affectationInterData.duration);
                setReport(affectationInterData.report);
                setTechnicien_id(affectationInterData.technicien_id);
                setIntervention_id(affectationInterData.intervention_id);
        
                // Fetch list of techniciens and interventions to populate the dropdowns
                const techniciensResponse = await Affectation_interFinder.get("/");
                setTechniciens(techniciensResponse.data.data.techniciens);
    
                const interventionsResponse = await Affectation_interFinder.get("/");
                setInterventions(interventionsResponse.data.data.interventions);
    
            } catch (error) {
                console.error("Error fetching affectation inter:", error);
            }
        };
    
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!duration.trim()) {
            errors.duration = "La durée est obligatoire";
        } else if (isNaN(duration.trim())) {
            errors.duration = "La durée doit être un nombre";
        }
        if (!report.trim()) {
            errors.report = "Le rapport est obligatoire";
        }
        if (!technicien_id.trim()) {
            errors.technicien_id = "Le technicien est obligatoire";
        }
        if (!intervention_id.trim()) {
            errors.intervention_id = "L'intervention est obligatoire";
        }

        if (Object.keys(errors).length === 0) {
            try {
                await Affectation_interFinder.put(`/${id}`, {
                    duration,
                    report,
                    technicien_id,
                    intervention_id
                });
                navigate('/affectation_inter'); // Redirect to the affectation_inter page after updating
            } catch (error) {
                console.error("Error updating affectation inter:", error);
            }
        } else {
            setErrors(errors);
        }
    };
    
    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="card">
                    <div className="card-header">
                        <button onClick={() => navigate('/affectation_inter')} className="btn btn-sm btn-danger float-right">Fermer</button>
                    </div>
                    <div className="card-body">
                        <form>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="duration">Durée</label>
                                        <input
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            id="duration"
                                            className={`form-control ${errors.duration && 'is-invalid'}`}
                                            type="text"
                                        />
                                        <div className="invalid-feedback">{errors.duration}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="report">Rapport</label>
                                        <input
                                            value={report}
                                            onChange={(e) => setReport(e.target.value)}
                                            id="report"
                                            className={`form-control ${errors.report && 'is-invalid'}`}
                                            type="text"
                                        />
                                        <div className="invalid-feedback">{errors.report}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="technicien_id">Technicien</label>
                                        <select
                                            value={technicien_id}
                                            onChange={(e) => setTechnicien_id(e.target.value)}
                                            className={`form-control ${errors.technicien_id && 'is-invalid'}`}
                                        >
                                            <option value="">Sélectionner un technicien</option>
                                            {techniciens.map(technicien => (
                                                <option key={technicien.id} value={technicien.id}>
                                                    {technicien.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="invalid-feedback">{errors.technicien_id}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="intervention_id">Intervention</label>
                                        <select
                                            value={intervention_id}
                                            onChange={(e) => setIntervention_id(e.target.value)}
                                            className={`form-control ${errors.intervention_id && 'is-invalid'}`}
                                        >
                                            <option value="">Sélectionner une intervention</option>
                                            {interventions.map(intervention => (
                                                <option key={intervention.id} value={intervention.id}>
                                                    {intervention.ref}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="invalid-feedback">{errors.intervention_id}</div>
                                    </div>
                                </div>
                                <div className="col-md-12">
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
export default UpdateAffectation_inter;
