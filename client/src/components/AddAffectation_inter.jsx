import React, { useState, useContext, useEffect } from "react";
import Affectation_interFinder from '../apis/Affectation_interFinder';
import { Affectation_intersContext } from '../context/Affectation_intersContext'; 

const AddAffectation_inter = ({ hideAddEquipement }) => {
    const { addAffectation_inter } = useContext(Affectation_intersContext);
    const [duration, setDuration] = useState("");
    const [report, setReport] = useState("");
    const [technicien_id, setTechnicien_id] = useState("");
    const [intervention_id, setIntervention_id] = useState("");
    const [techniciens, setTechniciens] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [errors, setErrors] = useState({
        duration: "",
        report: "",
        technicien_id: "",
        intervention_id: ""
    });

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
                const response = await Affectation_interFinder.get("/"); // Fetch data from backend
                setTechniciens(response.data.data.techniciens); 
                setInterventions(response.data.data.interventions);// Update techniciens and interventions state
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!duration.trim()) {
            errors.duration = "La durée estimée pour l'intervention est obligatoire";
        } else if (isNaN(duration.trim())) {
            errors.duration = "La durée estimée doit être un nombre";
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
                const response = await Affectation_interFinder.post("/", {
                    duration: duration,
                    report: report,
                    technicien_id: technicien_id,
                    intervention_id: intervention_id
                });
                addAffectation_inter(response.data.data.affectation_inter);
                clearForm();
                setRefresh(true); // Trigger page refresh after adding the affectation inter
            } catch (err) {
                console.log(err);
            }
        } else {
            setErrors(errors);
        }
    };
  
    const clearForm = () => {
        setDuration("");
        setReport("");
        setTechnicien_id("");
        setIntervention_id("");
        setErrors({
            duration: "",
            report: "",
            technicien_id: "",
            intervention_id: ""
        });
    };

    return (
        <div className="content-wrapper">
        <div className="card">
            <div className="card-body">
                <button onClick={hideAddEquipement} className="close-button">
                    <i className="fas fa-times"></i>
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Durée estimée pour l'intervention</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.duration && 'is-invalid'}`}
                                    placeholder="Durée estimée"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                                <div className="invalid-feedback">{errors.duration}</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Rapport</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.report && 'is-invalid'}`}
                                    placeholder="Rapport"
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                />
                                <div className="invalid-feedback">{errors.report}</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Technicien</label>
                                <select
                                    value={technicien_id}
                                    onChange={(e) => setTechnicien_id(e.target.value)}
                                    className={`custom-select ${errors.technicien_id && 'is-invalid'}`}
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
                                <label>Intervention</label>
                                <select
                                    value={intervention_id}
                                    onChange={(e) => setIntervention_id(e.target.value)}
                                    className={`custom-select ${errors.intervention_id && 'is-invalid'}`}
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
                    </div>
                    <button type="submit" className="btn btn-primary">Ajouter</button>
                </form>
            </div>
        </div>
        </div>
    );
};

export default AddAffectation_inter;
