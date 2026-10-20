import React, { useState, useContext, useEffect } from "react";
import InterventionFinder from '../apis/InterventionFinder';
import { InterventionsContext } from '../context/InterventionsContext'; 

const AddIntervention = () => {
    const { addIntervention } = useContext(InterventionsContext);
    
    const [ref, setRef] = useState("");
    const [hourNbr, setHourNbr] = useState("");
    const [typeInter, setTypeInter] = useState("");
    const [costInter, setCostInter] = useState("");
    const [beginDateHour, setBeginDateHour] = useState("");
    const [description, setDescription] = useState("");
    const [report, setReport] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [reclamation_id, setReclamation_id] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [technicien_id, setTechnicien_id] = useState("");
    const [techniciens, setTechniciens] = useState([]);
    const [equipments, setEquipments] = useState([]);
    const [reclamations, setReclamations] = useState([]);
    const [components, setComponents] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (refresh) {
            // Reload the page after adding an equipment
            window.location.reload();
            // Reset the refresh state to prevent continuous refresh
            setRefresh(false);
        }
    }, [refresh]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await InterventionFinder.get("/");
                setEquipments(response.data.data.equipments);
                setReclamations(response.data.data.reclamations);
                setComponents(response.data.data.components);
                setTechniciens(response.data.data.techniciens);
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!ref.trim()) {
            errors.ref = "La référence est obligatoire";
        }

        if (!typeInter.trim()) {
            errors.typeInter = "Le type d'intervention est obligatoire";
        }

        // Check for other validations here...

        if (Object.keys(errors).length === 0) {
            try {
                const currentDate = new Date().toISOString().slice(0, 10); // Get today's date

                const response = await InterventionFinder.post("/", {
                    ref: ref,
                    request_date: currentDate,
                    hour_nbr: hourNbr,
                    type_inter: typeInter,
                    cost_inter: costInter,
                    begin_date_hour: beginDateHour,
                    description: description,
                    report: report,
                    equipement_id: equipement_id,
                    reclamation_id: reclamation_id,
                    component_id: component_id,
                    technicien_id: technicien_id
                });
                addIntervention(response.data.data.intervention);
                clearForm();
                setRefresh(true);
            } catch (err) {
                console.log(err);
            }
        } else {
            // Handle errors here, like showing them to the user
            setErrors(errors);
        }
    };

    const clearForm = () => {
        setRef("");
        setRequestDate("");
        setHourNbr("");
        setTypeInter("");
        setCostInter("");
        setBeginDateHour("");
        setDescription("");
        setReport("");
        setEquipement_id("");
        setReclamation_id("");
        setComponent_id("");
        setTechnicien_id("");
        setErrors({});
    };

    return (
        <div className="content-wrapper">
            <div className="card">
                <div className="card-body">
                  
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Référence</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Référence"
                                        value={ref}
                                        onChange={(e) => setRef(e.target.value)}
                                    />
                                    {errors.ref && <span className="text-danger">{errors.ref}</span>}
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Nombre d'heures estimées de l'intervention</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nombre d'heures"
                                        value={hourNbr}
                                        onChange={(e) => setHourNbr(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <label>Type d'intervention</label>
                                <div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="type"
                                            value="corrective"
                                            checked={typeInter === "corrective"}
                                            onChange={(e) => setTypeInter(e.target.checked ? "corrective" : "")}
                                        />
                                        <label className="form-check-label">Corrective</label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="type"
                                            value="preventive"
                                            checked={typeInter === "preventive"}
                                            onChange={(e) => setTypeInter(e.target.checked ? "preventive" : "")}
                                        />
                                        <label className="form-check-label">Préventive</label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="type"
                                            value="predictive"
                                            checked={typeInter === "predictive"}
                                            onChange={(e) => setTypeInter(e.target.checked ? "predictive" : "")}
                                        />
                                        <label className="form-check-label">Prédictive</label>
                                    </div>
                                    {errors.typeInter && <span className="text-danger">{errors.typeInter}</span>}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Coût</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Coût"
                                        value={costInter}
                                        onChange={(e) => setCostInter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Date et heure début intervention </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={beginDateHour}
                                        onChange={(e) => setBeginDateHour(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Rapport</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Rapport"
                                        value={report}
                                        onChange={(e) => setReport(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Équipement</label>
                                    <select
                                        value={equipement_id}
                                        onChange={(e) => setEquipement_id(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="">Sélectionner un équipement</option>
                                        {equipments.map(equipment => (
                                            <option key={equipment.id} value={equipment.id}>
                                                {equipment.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Réclamation</label>
                                    <select
                                        value={reclamation_id}
                                        onChange={(e) => setReclamation_id(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="">Sélectionner une réclamation</option>
                                        {reclamations.map(reclamation => (
                                            <option key={reclamation.id} value={reclamation.id}>
                                                {reclamation.ref}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Composant</label>
                                    <select
                                        value={component_id}
                                        onChange={(e) => setComponent_id(e.target.value)}
                                        className="custom-select"
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
                                    <label>Technicien</label>
                                    <select
                                        value={technicien_id}
                                        onChange={(e) => setTechnicien_id(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="">Sélectionner un technicien</option>
                                        {techniciens.map(technicien => (
                                            <option key={technicien.id} value={technicien.id}>
                                                {technicien.name}
                                            </option>
                                        ))}
                                    </select>
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

export default AddIntervention;
