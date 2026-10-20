import React, { useState, useEffect, useContext } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { ReclamationsContext } from '../context/ReclamationsContext'; 
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';

// Fonction pour formater la date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    // Ajouter un zéro initial si le mois ou le jour est un seul chiffre
    if (month < 10) {
        month = `0${month}`;
    }
    if (day < 10) {
        day = `0${day}`;
    }

    return `${year}-${month}-${day}`;
};

const UpdateReclamation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addReclamation } = useContext(ReclamationsContext);
    const [ref, setRef] = useState("");
    const [priority, setPriority] = useState("");
    const [state, setState] = useState("");
    const [created_by, setCreated_by] = useState("");
    const [duration, setDuration] = useState("");
    const [description, setDescription] = useState("");
    const [datepanne, setDatepanne] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);

    const [composant_id, setComposant_id] = useState("");
    const [composants, setComposants] = useState([]);

    const [responsible, setResponsible] = useState("");
    const [employees, setEmployees] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [auth, setAuth] = useState(false);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({
        equipement_id:"",
        employee_id:"",
        priority:"",
        state:"",
        final_date:""
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
              const response = await ReclamationFinder.get(`/${id}`);
              const reclamationData = response.data.data.reclamation;
              setRef(reclamationData.ref);
              setEquipement_id(reclamationData.equipement_id);
              setComposant_id(reclamationData.composant_id);
              setResponsible(reclamationData.responsible);
              setPriority(reclamationData.priority);
              setState(reclamationData.state);
              setCreated_by(reclamationData.created_by);
              setDuration(reclamationData.duration);
              setDescription(reclamationData.description);
              if (!datepanne && reclamationData.datepanne) {
                const beginDate = new Date(reclamationData.datepanne);
                const offset = beginDate.getTimezoneOffset(); // Get timezone offset in minutes
                beginDate.setMinutes(beginDate.getMinutes() - offset); // Adjust the date by the offset
                const formattedDate = beginDate.toISOString().slice(0, 16);
                setDatepanne(formattedDate);
                } else {
                    setDatepanne("");
                }
        
              setFinal_date(new Date(reclamationData.final_date));
              setPlanified_date(new Date(reclamationData.planified_date));
              // Assurez-vous que employee_id est correctement défini ici
          } catch (error) {
              console.error("Error fetching reclamation:", error);
          }
      };
  
      fetchData();
  }, [id]);
  
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            const equipmentsResponse = await ReclamationFinder.get("/");
            setEquipments(equipmentsResponse.data.data.equipments);
            const employeesResponse = await ReclamationFinder.get("/");
            setEmployees(employeesResponse.data.data.employees);
        } catch (error) {
            console.error("Error fetching data:", error);
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


    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!priority.trim()) {
            errors.priority = "Priorité obligatoire";
        }
        if (!state.trim()) {
            errors.state = "État obligatoire";
        }
        if (!equipement_id) {
            errors.equipement_id = "Machine obligatoire";
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        try {
            const currentDate = new Date().toISOString().slice(0, 10);
            await ReclamationFinder.put(`/${id}`, {
                ref,
                equipement_id,
              
                priority,
                state,
                created_by,
                responsible,
                creation_date: currentDate,
                duration,
                description,
               datepanne ,
                
                final_date,
                planified_date,
                composant_id
            });
            navigate('/reclamation');
        } catch (err) {
            console.error("Error updating reclamation:", err);
        }
    };

    return (
        <div className="content-wrapper">
        <div className="card">
            <div className="card-body">
                <div className="justify-content">
                    <form onSubmit={handleSubmit}>
                        <div className="d-flex align-items-center">
                            <div className="ml-auto"> {/* Utilisation de ml-auto pour centrer les boutons à droite */}
                                <button type="submit" className="btn btn-primary mr-2">
                                    Ajouter
                                </button>
                                <button onClick={() => navigate('/reclamation')} className="btn btn-danger mr-2">Fermer</button>
                            </div>
                        </div>
                        <br />
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group row mb-4">
                                    <label htmlFor="ref" className="col-sm-3 col-form-label">Reference:</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="text"
                                            id="ref"
                                            className="inputstyle form-control "
                                            placeholder="Reference"
                                            value={ref}
                                            onChange={(e) => setRef(e.target.value)}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="form-group row mb-4">
                                    <label htmlFor="equipment_id" className="col-sm-3 col-form-label">Machine</label>
                                    <div className="col-sm-7">
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
                                <div className="form-group row mb-4">
                                    <label htmlFor="composant_id" className="col-sm-3 col-form-label">Composant</label>
                                    <div className="col-sm-7">
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
                                <div className="form-group row mb-4">
                                    <label htmlFor="priority" className="col-sm-3 col-form-label">Priorité:</label>
                                    <div className="col-sm-7">
                                        <select
                                            id="priority"
                                            className="inputstyle form-control "
                                            value={priority}
                                            onChange={(e) => {
                                                setPriority(e.target.value);
                                                if (e.target.value === "Urgente") {
                                                    setDuration("");
                                                    setFinal_date("");
                                                    setPlanified_date("");
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
                                <div className="form-group row mb-4">
                                    <label htmlFor="state" className="col-sm-3 col-form-label">État:</label>
                                    <div className="col-sm-7">
                                        <select
                                            id="state"
                                            className="inputstyle form-control "
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                        >
                                            <option value="">Sélectionner un état</option>
                                            <option value="En attente...">En attente...</option>
                                            <option value="En cours">En cours</option>
                                            <option value="Terminée">Terminée</option>
                                            <option value="Fermé">Fermé</option>
                                        </select>
                                        {errors.state && <div className="text-danger">{errors.state}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group row mb-4">
                                    <label htmlFor="created_by" className="col-sm-3 col-form-label">créé par:</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="text"
                                            id="created_by"
                                            className="inputstyle form-control "
                                            placeholder="Created By"
                                            value={name}
                                            onChange={(e) => setCreated_by(e.target.value)}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="form-group row mb-4">
                                  
                                        <label htmlFor="employee_id" className="col-sm-3 col-form-label">Responsable:</label>
                                        <div className="col-sm-7">
                                        <select
                                            id="responsible"
                                            value={responsible}
                                            onChange={(e) => setResponsible(e.target.value)}
                                            className="custom-select"
                                        >
                                            <option value="">Select Responsable</option>
                                            {employees.map(employee => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.firstname}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                            </div>
                                <div className="form-group row mb-4">
                                    <label htmlFor="datepanne" className="col-sm-3 col-form-label">Date de panne</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="datetime-local"
                                            className={`inputstyle form-control `}
                                            placeholder=""
                                            name="datepanne"
                                            value={datepanne}
                                            onChange={(e) => setDatepanne(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {priority === "Élevée" && (
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="duration">Durée maximale par heure:</label>
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
                                                <label htmlFor="final_date">Date limite pour la tache:</label>
                                                <input
                                                    type="date"
                                                    id="final_date"
                                                    className="form-control"
                                                    placeholder="Final Date"
                                                    value={formatDate(final_date)}
                                                    onChange={(e) => setFinal_date(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]} // Set min date to current date
                                                />
                                                {errors.final_date && <div className="text-danger">{errors.final_date}</div>}
                                            </div>
                                        </div>
                                        <div className="form-group row mb-4">
                                            <label htmlFor="planified_date" className="col-sm-3 col-form-label">Date idéale pour faire la tache :</label>
                                            <div className="col-sm-7">
                                                <input
                                                    type="date"
                                                    id="planified_date"
                                                    className="form-control"
                                                    placeholder="Planified Date"
                                                    value={formatDate(planified_date)}
                                                    onChange={(e) => setPlanified_date(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]} // Set min date to current date
                                                />
                                            </div>
                                        </div>
                            
                                    </>
                                )}
                                  
                                  <div className="form-group row mb-4">
                                    <label htmlFor="description" className="col-sm-3 col-form-label">Description</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="text"
                                            className="inputstyle form-control "
                                            placeholder="Ecrire des details sur cette reclamation"
                                            name="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            </div>
                        
                   
                    </form>
                </div>
            </div>
        </div>
        </div>
    );
}    
export default UpdateReclamation;
