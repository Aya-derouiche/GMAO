import React, { useState, useContext, useEffect } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { ReclamationsContext } from '../context/ReclamationsContext';
import { Link } from "react-router-dom";
import axios from 'axios';

const AddReclamation = ({ hideAddEquipement }) => {
    const { addReclamation } = useContext(ReclamationsContext);
    const [ref, setRef] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [composant_id, setComposant_id] = useState("");
    const [employee_id, setEmployee_id] = useState("");
    const [priority, setPriority] = useState("");
    const [state, setState] = useState("");
    const [created_by, setCreated_by] = useState("");
    const [duration, setDuration] = useState(null);
    const [description, setDescription] = useState("");
    const [datepanne, setDatepanne] = useState(null);
    const [composants, setComposants] = useState([]);
    const [equipments, setEquipments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [auth, setAuth] = useState(false);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({
        equipement_id: "",
        employee_id: "",
        priority: "",
        state: "",
        final_date: ""
    });
    const [final_date, setFinal_date] = useState(null);
    const [planified_date, setPlanified_date] = useState(null);

    useEffect(() => {
        axios.get('/backend')
            .then(res => {
                if (res.data.status === "Success") {
                    setAuth(true);
                    setName(res.data.name);
                    setCreated_by(res.data.name);
                } else {
                    setAuth(false);
                    setMessage(res.data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setMessage('Failed to fetch data');
            });
    }, []);

    useEffect(() => {
        if (refresh) {
            window.location.reload();
            setRefresh(false);
        }
    }, [refresh]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ReclamationFinder.get("/");
                setEquipments(response.data.data.equipments);
                setEmployees(response.data.data.employees);
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (equipement_id) {
                    // Fetch the selected equipment object based on its ID
                    const selectedEquipment = equipments.find(equipment => equipment.id === equipement_id);
                    if (selectedEquipment) {
                        // If the selected equipment exists, fetch composants based on its name
                        const response = await axios.get(`/backend/api/v1/composant_equip/${selectedEquipment.name}`);
                        setComposants(response.data.data.composants);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchData();
    }, [equipement_id, equipments]); // Include equipments in the dependency array
    
    

    useEffect(() => {
        const fetchLastReclamationId = async () => {
            try {
                const response = await axios.get('/backend/api/v1/reclamation2');
                if (response.data.status === "success") {
                    const lastId = response.data.data.lastId;
                    setRef(`REF${lastId + 1}`);
                }
            } catch (error) {
                console.error('Error fetching last reclamation ID:', error);
            }
        };

        fetchLastReclamationId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!priority.trim()) {
            errors.priority = "Priorité obligatoire";
        }
    
        if (!equipement_id) {
            errors.equipement_id = "Machine obligatoire";
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        try {
            const currentDate = new Date().toISOString();
            const datePanneToSend = datepanne ? datepanne : currentDate;
            const response = await ReclamationFinder.post("/", {
                ref,
                equipement_id,
                employee_id,
                priority,
                state: "En attente...",
                created_by,
                responsible: employee_id,
                creation_date: currentDate,
                duration,
                description,
                final_date,
                planified_date,
                datepanne: datePanneToSend,
                composant_id,
            });
            addReclamation(response.data.data.reclamation);
            clearForm();
            setRefresh(true);
        } catch (err) {
            console.log(err);
        }
    };
    
    

    const clearForm = () => {
        setEquipement_id("");
        setEmployee_id("");
        setPriority("");
        setState("");
        setDuration("");
        setDescription("");
        setFinal_date("");
        setPlanified_date("");
        setDatepanne("");
    };
    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card">
                        <div className="card-body">
                            <button onClick={hideAddEquipement} className="close-button">
                                <i className="fas fa-times"></i>
                            </button>
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group">
                                        <label htmlFor="ref" style={{color: 'grey'}}>Reference:</label>
                                            <input
                                                type="text"
                                                id="ref"
                                                className="form-control"
                                                placeholder="Reference"
                                                value={ref}
                                                onChange={(e) => setRef(e.target.value)}
                                                disabled // Disable manual modification of the reference field
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="equipment_id"style={{color: 'black'}}>Machine</label>
                                            <select
                                                id="equipment_id"
                                                value={equipement_id}
                                                onChange={(e) => setEquipement_id(e.target.value)}
                                                className="custom-select"
                                            >
                                                <option value="">Select Machine</option>
                                                {equipments.map(equipment => (
                                                    <option key={equipment.id} value={equipment.id}>
                                                        {equipment.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.equipement_id && <div className="text-danger">{errors.equipement_id}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="composant_id"style={{color: 'black'}}>Composant</label>
                                            <select
                                                id="composant_id"
                                                value={composant_id}
                                                onChange={(e) => setComposant_id(e.target.value)}
                                                className="custom-select"
                                            >
                                                <option value="">Select Composant</option>
                                                {composants.map(composant => (
                                                    <option key={composant.id} value={composant.id}>
                                                        {composant.name_comp}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="datepanne"style={{color: 'black'}}>Date de panne</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                id="datepanne"
                                                value={datepanne}
                                                onChange={(e) => setDatepanne(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="priority"style={{color: 'black'}}>Priorité:</label>
                                            <select
                                                id="priority"
                                                className="form-control"
                                                value={priority}
                                                onChange={(e) => {
                                                    setPriority(e.target.value);
                                                    // Hide/show fields based on priority selection
                                                    if (e.target.value === "Urgente") {
                                                        setDuration("");
                                                        setFinal_date(""); // Reset final_date when priority changes
                                                        setPlanified_date(""); // Reset planified_date when priority changes
                                                    } else if (e.target.value === "Élevée") {
                                                        setDuration("");
                                                        setFinal_date("");
                                                        setPlanified_date("");
                                                    } else if (e.target.value === "Moyenne") {
                                                        setFinal_date("");
                                                        setPlanified_date("");
                                                    } else if (e.target.value === "Basse") {
                                                        setFinal_date("");
                                                        setPlanified_date("");
                                                    }
                                                }}
                                            >
                                                <option value="">Sélectionner une priorité</option>
                                                <option value="Urgente" style={{ color: '#E74C3C', fontWeight: 'bold' }}>Urgente</option>
                                                <option value="Élevée" style={{ color: '#FF5733' }}>Élevée</option>
                                                <option value="Moyenne" style={{ color: '#FFC300' }}>Moyenne</option>
                                                <option value="Basse" style={{ color: '#3498DB' }}>Basse</option>
                                            </select>
                                            {errors.priority && <div className="text-danger">{errors.priority}</div>}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="created_by"style={{color: 'grey'}}>créé par:</label>
                                            <input
                                                type="text"
                                                id="created_by"
                                                className="form-control"
                                                placeholder="Created By"
                                                value={name} // Use the name variable to fill the field automatically
                                                onChange={(e) => setCreated_by(e.target.value)}
                                                disabled // Disable manual modification of the field
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="employee_id"style={{color: 'black'}}>Responsable:</label>
                                            <select
                                                id="employee_id"
                                                value={employee_id}
                                                onChange={(e) => setEmployee_id(e.target.value)}
                                                className="custom-select"
                                            >
                                                <option value="">Select Responsable</option>
                                                {employees.map(employee => (
                                                    <option key={employee.id} value={employee.id}>
                                                        {employee.firstname}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.employee_id && <div className="text-danger">{errors.employee_id}</div>}
                                        </div>
                                    </div>
                                    {priority === "Élevée" && (
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="duration"style={{color: 'black'}}>Durée maximale par heure:</label>
                                                <input
                                                    type="number"
                                                    id="duration"
                                                    className="form-control"
                                                    placeholder="Durée maximale /hr"
                                                    value={duration}
                                                    onChange={(e) => setDuration(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {(priority === "Moyenne" || priority === "Basse") && (
                                        <>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="final_date"style={{color: 'black'}}>Date limite d'intervention</label>
                                                    <input
                                                        type="date"
                                                        id="final_date"
                                                        className="form-control"
                                                        placeholder="Final Date"
                                                        value={final_date}
                                                        onChange={(e) => setFinal_date(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]} // Set min date to current date
                                                    />
                                                    {errors.final_date && <div className="text-danger">{errors.final_date}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="planified_date"style={{color: 'black'}}>Préférable date d'intervention :</label>
                                                    <input
                                                        type="date"
                                                        id="planified_date"
                                                        className="form-control"
                                                        placeholder="Planified Date"
                                                        value={planified_date}
                                                        onChange={(e) => setPlanified_date(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]} // Set min date to current date
                                                        max={final_date} // Set max date to the final date selected by the user
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="description"style={{color: 'black'}}>Description</label>
                                            <input
                                                type="text"
                                                id="description"
                                                className="form-control"
                                                placeholder="Ecrire des details sur cette reclamation"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">Ajouter</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}    
export default AddReclamation;
