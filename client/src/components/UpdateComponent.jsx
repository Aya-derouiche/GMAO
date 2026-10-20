import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ComponentFinder from '../apis/ComponentFinder';
import { ComponentsContext } from '../context/ComponentsContext';

const UpdateComponent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateComponent } = useContext(ComponentsContext);
    const [name, setName] = useState("");
    const [ref, setRef] = useState("");
    const [description, setDescription] = useState("");
    const [breakdown_date, setBreakdown_date] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [isBreakdownDateRequired, setIsBreakdownDateRequired] = useState(false);
    const [showBreakdownDate, setShowBreakdownDate] = useState(false);
    const [errors, setErrors] = useState({
        name: "",
        ref: "",
        description: "",
        breakdown_date: "",
        equipement_id: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ComponentFinder.get("/");
                setEquipments(response.data.data.equipments);
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ComponentFinder.get(`/${id}`);
                const componentData = response.data.data.component;
                setName(componentData.name);
                setRef(componentData.ref);
                setDescription(componentData.description);
                if (componentData.breakdown_date) {
                    const date = new Date(componentData.breakdown_date);
                    date.setDate(date.getDate() + 1); // Ajouter un jour à la date
                    setBreakdown_date(date.toISOString().split('T')[0]);
                } else {
                    setBreakdown_date("");
                }
                setEquipement_id(componentData.equipement_id);
                setIsBreakdownDateRequired(Boolean(componentData.breakdown_date));
                setShowBreakdownDate(Boolean(componentData.breakdown_date));
            } catch (error) {
                console.error("Error fetching component:", error);
            }
        };
    
        fetchData();
    }, [id]);
    

    const handleCancel = () => {
        // Optionally implement cancel functionality
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
            await ComponentFinder.put(`/${id}`, {
                name,
                ref,
                description,
                breakdown_date: isBreakdownDateRequired ? breakdown_date : null,
                equipement_id
            });
            // Optionally, update context or state if needed
            navigate('/component');
        } catch (error) {
            console.error("Error updating component:", error);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="card">
                    <div className="card-header">
                        <button onClick={() => navigate('/component')} className="btn btn-sm btn-danger float-right">Fermer</button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Nom du composant</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    id="name"
                                    className={`form-control ${errors.name && 'is-invalid'}`}
                                    type="text"
                                />
                                <div className="invalid-feedback">{errors.name}</div>
                            </div>
    
                            <div className="form-group">
                                <label htmlFor="ref">Référence</label>
                                <input
                                    value={ref}
                                    onChange={(e) => setRef(e.target.value)}
                                    id="ref"
                                    className={`form-control ${errors.ref && 'is-invalid'}`}
                                    type="text"
                                />
                                <div className="invalid-feedback">{errors.ref}</div>
                            </div>
    
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    id="description"
                                    className="form-control"
                                    type="text"
                                />
                            </div>
                            {showBreakdownDate && (
    <>
        <div className="form-group">
            <label htmlFor="breakdown_date">Date de panne</label>
            <input
                value={breakdown_date}
                onChange={(e) => setBreakdown_date(e.target.value)}
                id="breakdown_date"
                className={`form-control ${errors.breakdown_date && 'is-invalid'}`}
                type="date"
                min={new Date().toISOString().split('T')[0]} // Set min date to current date
            />
            <div className="invalid-feedback">{errors.breakdown_date}</div>
        </div>
        <button
            className="btn btn-sm btn-secondary mb-2"
            onClick={() => {
                setShowBreakdownDate(false);
                setIsBreakdownDateRequired(false); // Set isBreakdownDateRequired to false when removing breakdown date
            }}
        >
            Supprimer la date de panne
        </button>
    </>
)}

{!showBreakdownDate && (
    <div className="form-check mb-3">
        <input
            type="checkbox"
            className="form-check-input"
            id="addBreakdownDateCheckbox"
            checked={isBreakdownDateRequired}
            onChange={() => {
                setShowBreakdownDate(true);
                setIsBreakdownDateRequired(true); // Set isBreakdownDateRequired to true when adding breakdown date
            }}
        />
        <label className="form-check-label" htmlFor="addBreakdownDateCheckbox">Ajouter une date de panne</label>
    </div>
)}


                            <div className="form-group">
                                <label htmlFor="equipement_id">Équipement</label>
                                <select
                                    value={equipement_id}
                                    onChange={(e) => setEquipement_id(e.target.value)}
                                    className={`form-control ${errors.equipement_id && 'is-invalid'}`}
                                >
                                    <option value="">Sélectionner un équipement</option>
                                    {equipments.map(equipment => (
                                        <option key={equipment.id} value={equipment.id}>
                                            {equipment.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="invalid-feedback">{errors.equipement_id}</div>
                            </div>
    
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Soumettre
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateComponent;
