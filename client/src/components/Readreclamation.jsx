import React, { useEffect, useState, useContext } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { ReclamationsContext } from '../context/ReclamationsContext';
import { useParams, Link, useNavigate } from "react-router-dom";
import "./ReadReclamation.css";
import { toast } from "react-toastify";
import axios from 'axios';

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const ReadReclamation = () => {
    const [reclamation, setReclamation] = useState(null);
    const { reclamations, setReclamations } = useContext(ReclamationsContext);
    const [message, setMessage] = useState('');
    const [auth, setAuth] = useState(false);
    const [role, setRole] = useState('');
    axios.defaults.withCredentials = true;
    const { ref } = useParams();
    const navigate = useNavigate();
    const [equipements, setEquipements] = useState([]);
    const [techniciens, setTechniciens] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [affecterClicked, setAffecterClicked] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [responsible, setResponsible] = useState("");
    const [technicien_id, setTechnicien_id] = useState("");
    const [equipementName, setEquipementName] = useState("");
    const [composants, setComposants] = useState([]);
    const [composantName, setComposantName] = useState("");
    const [composantsParEquipement, setComposantsParEquipement] = useState({}); // Add state for storing components per equipment

    const [errors, setErrors] = useState({
        technicien_id: ""
    });
     
    useEffect(() => {
        axios.get('http://localhost:3001', { withCredentials: true })
          .then(res => {
            if (res.data.status === "Success") {
              setAuth(true);
              setRole(res.data.role);
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
        const fetchReclamation = async () => {
            try {
                const response = await ReclamationFinder.get(`/reclamationRef/${ref}`);
                const data = response.data.data.reclamation;
                setReclamation(data);
                setResponsible(data.responsible);
                setEquipementName(data.equipement_name);
                
                setComposantName(data.composant_name); // Set the component name
            } catch (err) {
                console.error(err);
            }
        };

        fetchReclamation();
    }, [ref]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const equipementsResponse = await ReclamationFinder.get("/");
                setEquipements(equipementsResponse.data.data.equipements);
               
                const employeesResponse = await ReclamationFinder.get("/");
                setEmployees(employeesResponse.data.data.employees);
                const techniciensResponse = await ReclamationFinder.get("/");
                setTechniciens(techniciensResponse.data.data.techniciens);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);


   
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!selectedTechnician.trim()) {
            errors.technicien_id = "Choisir un Technicien";
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        try {
            const currentDate = new Date().toISOString().slice(0, 10);
            await ReclamationFinder.put(`/reclamationRef/${ref}`, {
                affecter: true,
                technicien_id: selectedTechnician,
            });
            toast.success('Cette réclamation a été affectée avec succès');
            navigate('/reclamation'); 
        } catch (err) {
            console.error("Error updating reclamation:", err);
            toast.error('Erreur lors de l\'affectation de la réclamation');
        }
    };

    const handleAffecterClick = () => {
        setAffecterClicked(true);
    };

    const handleHideClick = () => {
        setAffecterClicked(false);
    };

    return (
        <div className="content-wrapper">
            <section className="content">
                {reclamation && (
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title">
                                <Link to={role === "admin" ? "/reclamation" : "/reclamation_tech"}>Réclamation</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                <Link to="">Détails de la panne</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                {ref}
                            </h5>
                            <div className="card-tools">
                                <button type="button" className="btn btn-tool" data-card-widget="collapse" title="Collapse">
                                    <i className="fas fa-minus"></i>
                                </button>
                                <button type="button" className="btn btn-tool" data-card-widget="remove" title="Remove">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-12 col-md-12 col-lg-8 order-2 order-md-1">
                                    <div className="row">
                                        <div className="col-12 col-sm-4">
                                            <div className="info-box bg-light">
                                                <div className="info-box-content">
                                                    <span className="info-box-text text-center text-muted">État de la réclamation</span>
                                                    <span className="
info-box-number text-center text-muted mb-0">{reclamation.state}</span>
</div>
</div>
</div>
<div className="col-12 col-sm-4">
<div className="info-box bg-light">
<div className="info-box-content">
    <span className="info-box-text text-center text-muted">Priorité</span>
    <span className="info-box-number text-center text-muted mb-0">{reclamation.priority}</span>
</div>
</div>
</div>
<div className="col-12 col-sm-4">
<div className="info-box bg-light">
<div className="info-box-content">
<span className="info-box-number text-center text-muted mb-0">{reclamation.affecter ? "Affectée" : "Non Affectée"}</span>
</div>
</div>
</div>
</div>
<div className="row">
<div className="col-12">
<h4></h4>
<div className="post">
<div className="user-block">
    <br />
</div>
<p style={{ fontWeight: 'bold' }}>Description de la réclamation {reclamation.ref}</p>
<p className="card-text">{reclamation.description}</p>
</div>
{!affecterClicked && (
<div className="text-center mt-5 mb-3">
    {role === "technician" &&  (
        <button className="btn btn-sm btn-success" onClick={() => navigate(`/equipements/${reclamation.equipement_id}/updaterec`)}>Traiter</button>
    )}
    &nbsp;&nbsp;
    <button className="btn btn-sm btn-warning btn-wink" onClick={handleAffecterClick}> Affecter </button>
</div>
)}

{/* Select input for technicians */}
{affecterClicked && (
<div className="d-flex flex-column ">
    <select 
        className={`custom-select ${errors.technicien_id && 'is-invalid'}`}
        style={{ width: "100%", maxWidth: "250px" }}
        value={selectedTechnician}
        onChange={(e) => setSelectedTechnician(e.target.value)}
    >
        <option value="">Sélectionner un technicien</option>
        {techniciens.map(technicien => (
            <option key={technicien.id} value={technicien.id}>{technicien.name}</option>
        ))}
    </select>
    <div className="invalid-feedback">{errors.technicien_id}</div>
    <div className="text-center mt-2 mb-2">
        <button className="btn btn-primary mt-2" onClick={handleSubmit}>
            Soumettre
        </button>

        {/* Button to hide the form */}
        <button className="btn btn-danger mt-2" onClick={handleHideClick}>
            Cacher
        </button>
    </div>
</div>
)}
</div>
</div>
</div>
<hr />
<div className="col-12 col-md-12 col-lg-4 order-1 order-md-2">
<div className="user-block">
<h4 className="text-secondary">
<img className="img-bordered-lg" src={`http://localhost:3001/${reclamation.equipement_image}`} alt="img" style={{width: '80px', height: '80px'}} />
&nbsp; Machine: &nbsp;<br></br> &nbsp;&nbsp;{equipementName}
</h4> 

<h5 className="mt-5 text-muted">Details</h5>
<ul className="list-unstyled">
<li>
<i className="fas fa-marker"></i>
Crée par : {reclamation.created_by}
</li>
<li>
<i className="far fa-fw fa-user"></i>
Responsable: {employees.find(employee => employee.id === responsible)?.firstname}
</li>
<li>
<i className="far fa-fw fa-calendar"></i>
Date de création: {formatDate(reclamation.creation_date)}
</li>

<li>
{reclamation.priority === 'Moyenne' || reclamation.priority === 'Basse' ? (
    <>
        <li> <i className="far fa-fw fa-calendar"></i>
        Date Limite pour faire la tâche: {formatDate(reclamation.final_date)}</li>
        <li> <i className="far fa-fw fa-calendar"></i>
        Date idéale pour faire la tâche: {formatDate(reclamation.planified_date)}
        </li>
    </>
) : (
    reclamation.priority === 'Élevée' && (
        <li> <i className="far fa-fw fa-clock"></i>
        Durée: {reclamation.duration}
        </li>
    )
)}
</li>
{/* Afficher le nom du technicien si la réclamation est affectée */}
{reclamation.affecter && (
<li>
    <i className="far fa-fw fa-user"></i>
    Technicien affecté: {techniciens.find(technicien => technicien.id === reclamation.technicien_id)?.name}
</li>
)}
<li>

        <i className="fas fa-cog"></i> Composant: {composantName}

</li>
</ul>
</div>
</div>
</div>
</div>
</div>
)}
</section>
</div>
);
};

export default ReadReclamation;
