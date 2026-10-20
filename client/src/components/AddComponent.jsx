import React, { useState, useContext, useEffect } from "react";
import ComponentFinder from '../apis/ComponentFinder';
import { ComponentsContext } from '../context/ComponentsContext'; 
import { Link } from "react-router-dom";

const AddComponent = ({ hideAddComponent }) => {
    const { addComponent } = useContext(ComponentsContext);
    const [name, setName] = useState("");
    const [ref, setRef] = useState("");
    const [description, setDescription] = useState("");
    const [breakdown_date, setBreakdown_date] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [isBreakdownDateRequired, setIsBreakdownDateRequired] = useState(false);
    const [errors, setErrors] = useState({
        name: "",
        ref: "",
        description: "",
        breakdown_date: "",
        equipement_id: ""
    });

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
                const response = await ComponentFinder.get("/"); // Fetch data from backend
                setEquipments(response.data.data.equipments); // Update equipments state
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleCancel = () => {
        clearForm();  
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate form fields
        const errors = {};
        if (!name.trim()) {
            errors.name = "Nom est obligatoire";
        }
        if (!ref.trim()) {
            errors.ref = "Référence est obligatoire";
        }
       
        if (isBreakdownDateRequired && !breakdown_date) {
            errors.breakdown_date = "Date de panne est obligatoire";
        }
        if (!equipement_id.trim()) {
            errors.equipement_id = "Machine est obligatoire";
        }

        // If there are errors, set them and prevent form submission
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

        // If no errors, proceed with form submission
        try {
            const response = await ComponentFinder.post("/", {
                name,
                ref,
                description,
                breakdown_date: isBreakdownDateRequired ? breakdown_date : null,
                equipement_id
            });
            addComponent(response.data.data.component);
            clearForm();
            setRefresh(true); // Trigger page refresh after adding the equipment
        } catch (err) {
            console.log(err);
        }
    };

    const clearForm = () => {
        setName("");
        setRef("");
        setDescription("");
        setBreakdown_date("");
        setEquipement_id("");
        setErrors({
            name: "",
            ref: "",
            description: "",
            breakdown_date: "",
            equipement_id: ""
        });
    };

    return (
        <div className="card">
            <div className="card-body">
                <button onClick={hideAddComponent} className="close-button">
                    <i className="fas fa-times"></i>
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nom</label>
                        <input
                            type="text"
                            className={`form-control ${errors.name && 'is-invalid'}`}
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.name}</div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="ref">Référence</label>
                        <input
                            type="text"
                            className={`form-control ${errors.ref && 'is-invalid'}`}
                            placeholder="Reference"
                            value={ref}
                            onChange={(e) => setRef(e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.ref}</div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <input
                            type="text"
                            className={`form-control`}
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.description}</div>
                    </div>
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="breakdownDateCheckbox"
                            checked={isBreakdownDateRequired}
                            onChange={(e) => setIsBreakdownDateRequired(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="breakdownDateCheckbox">Date de maintenancce obligatoire </label>
                    </div>
                    {isBreakdownDateRequired && (
                        <div className="form-group">
                            <label htmlFor="breakdown_date">Date de panne</label>
                            <input
                                type="date"
                                className={`form-control ${errors.breakdown_date && 'is-invalid'}`}
                                placeholder="Breakdown Date"
                                name="Breakdown_date"
                                value={breakdown_date}
                                onChange={(e) => setBreakdown_date(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // Set min date to current date
 
                            />
                            <div className="invalid-feedback">{errors.breakdown_date}</div>
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="equipement_id">Machine</label>
                        <select
                            value={equipement_id}
                            onChange={(e) => setEquipement_id(e.target.value)}
                            id="equipment"
                            className={`custom-select ${errors.equipement_id && 'is-invalid'}`}
                        >
                            <option value="">Machine</option>
                            {equipments.map(equipment => (
                                <option key={equipment.id} value={equipment.id}>
                                    {equipment.name}
                                </option>
                            ))}
                        </select>
                        <div className="invalid-feedback">{errors.equipement_id}</div>
                    </div>
                    <button type="submit" className="btn btn-primary">Ajouter</button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>Annuler</button>         
                </form>
            </div>
        </div>
    );
};

export default AddComponent;
