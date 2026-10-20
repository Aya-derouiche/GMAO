import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { EquipementsContext } from "../context/EquipementsContext";
import EquipementFinder from "../apis/EquipementFinder";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './Updateequip.css';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { mediaUrl } from '../utils/mediaUrl';
Modal.setAppElement('#root'); // Set the root element for accessibility

const UpdateEquipperiode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { UpdateEquipement } = useContext(EquipementsContext);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [model, setModel] = useState("");
  const [serial_number, setSerial_number] = useState("");
  const [status, setStatus] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [warranty_expiration_date, setWarranty_expiration_date] = useState("");
  const [cost, setCost] = useState(0);
  const [cout_unit, setCout_unit] = useState(0);
  const [secteur_id, setSecteur_id] = useState("");
  const [secteurs, setSecteurs] = useState([]);
  const [unit_id, setUnit_id] = useState("");
  const [units, setUnits] = useState([]);
  const [type, setType] = useState("");
  const [cycle, setCycle] = useState("");
  const [showWarranty, setShowWarranty] = useState(false);
  const [isWarrantyRequired, setIsWarrantyRequired] = useState(false);
  const [current_value, setCurrent_value] = useState("");
  const [last_maint_value, setLast_maint_value] = useState("");
  const [last_maint_date, setLast_maint_date] = useState("");
  const [descriptionprev, setDescriptionprev] = useState("");
  const [isMaintenancePreventive, setIsMaintenancePreventive] = useState(false);
  const [message, setMessage] = useState('');
  const [auth, setAuth] = useState(false);
  const [role, setRole] = useState('');
  const [isWarrantySet, setIsWarrantySet] = useState(false);
  const [technicien, setTechniciens] = useState([]);
  const [notifprev, setNotifprevs] = useState([]);

  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
  const [showTraiterButton, setShowTraiterButton] = useState(true);
  const [showTraitAndAffectButtons, setShowTraitAndAffectButtons] = useState(true);
  const [showRapportTab, setShowRapportTab] = useState(false);

  const [cout_intervention, setCout_intervention] = useState("");
  const [duree_inter, setDuree_inter] = useState("");
  const [type_maint, setType_maint] = useState("");
  const [date_debut, setDate_debut] = useState("");
  const [date_fin, setDate_fin] = useState("");
  const [fichier, setFichier] = useState("");
  const [description_inter, setDescription_inter] = useState("");


  const [errors, setErrors] = useState({
    name: "",
    location: "",
    model: "",
    serial_number: "",
    status: "",
    warranty_expiration_date: "",
    secteur_id: "",
    type: "",
    cycle: "",
    current_value: "",
    last_maint_value: "",
  });
  const [showStates, setShowStates] = useState(false); 
  axios.defaults.withCredentials = true;
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '300px',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
  };
  useEffect(() => {
    axios.get('/backend', { withCredentials: true })
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
    const fetchData = async () => {
      try {
        const response = await EquipementFinder.get(`/${id}`);
        const equipementData = response.data.data.equipement;
        setName(equipementData.name);
        setLocation(equipementData.location);
        setModel(equipementData.model);
        setSerial_number(equipementData.serial_number);
        setStatus(equipementData.status);
        setDescription(equipementData.description);
        if (equipementData.warranty_expiration_date) {
          const date = new Date(equipementData.warranty_expiration_date);
          date.setDate(date.getDate() + 1);
          setWarranty_expiration_date(date.toISOString().split('T')[0]);
          setIsWarrantySet(true);
        } else {
          setWarranty_expiration_date("");
        }
        setCost(equipementData.cost);
        setCout_unit(equipementData.cout_unit);
        setSecteur_id(equipementData.secteur_id);
        setType(equipementData.type);
        setCycle(equipementData.cycle);
        setUnit_id(equipementData.unit_id);
        setImage(equipementData.image || "");
        setCurrent_value(equipementData.current_value);
        setLast_maint_value(equipementData.last_maint_value);

        if (equipementData.last_maint_date) {
          const beginDate = new Date(equipementData.last_maint_date);
          const offset = beginDate.getTimezoneOffset();
          beginDate.setMinutes(beginDate.getMinutes() - offset);
          const formattedDate = beginDate.toISOString().slice(0, 16);
          setLast_maint_date(formattedDate);
        } else {
          setLast_maint_date("");
        }

        setCout_intervention(equipementData.cout_intervention);
        setDuree_inter(equipementData.duree_inter);
        setType_maint(equipementData.type_maint);
        setDate_debut(equipementData.date_debut);
        setDate_fin(equipementData.date_fin);
        setFichier(equipementData.fichier || "");
        setDescription_inter(equipementData.description_inter);

        setDescriptionprev(equipementData.descriptionprev);

        if (equipementData.warranty_expiration_date) {
          setShowWarranty(true);
          setIsWarrantyRequired(true);
        }

        if (equipementData.type === 'Produit') {
          const unitsResponse = await axios.get("/backend/api/v1/unitproduit");
          setUnits(unitsResponse.data.data.unit);
        } else if (equipementData.type === 'Periode') {
          const unitsResponse = await axios.get("/backend/api/v1/unitperiode");
          setUnits(unitsResponse.data.data.unit);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await EquipementFinder.get("/");
        setSecteurs(response.data.data.secteurs);
        if (type === 'Produit') {
          const unitsResponse = await axios.get("/backend/api/v1/unitproduit");
          setUnits(unitsResponse.data.data.unit);
        } else if (type === 'Periode') {
          const unitsResponse = await axios.get("/backend/api/v1/unitperiode");
          setUnits(unitsResponse.data.data.unit);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const techniciensResponse = await axios.get('/backend/api/v1/technicien/techid');
        setTechniciens(techniciensResponse.data.data.technicien);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notifprevsResponse = await axios.get('/backend/api/v1/notifprev');
        setNotifprevs(notifprevsResponse.data.data.notifprev);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!name.trim()) {
      errors.name = "Nom est obligatoire";
    } else if (name.trim().length < 4) {
      errors.name = "Le nom doit comporter au moins 4 caractères";
    }
    if (!location.trim()) {
      errors.location = "Emplacement est obligatoire";
    }
    if (!model.trim()) {
      errors.model = "Modèle est obligatoire";
    }
    if (!serial_number.trim()) {
      errors.serial_number = "Numero de serie est obligatoire";
    } else if (!/^\d+$/.test(serial_number.trim())) {
      errors.serial_number = "Ce champ n'accepte que les chiffres";
    }

    if (!isWarrantySet && isWarrantyRequired && !warranty_expiration_date) {
      errors.warranty_expiration_date = "Date fin-Garantie est obligatoire";
    }
    if (!secteur_id.trim()) {
      errors.secteur_id = "Secteur est obligatoire";
    }
    if (!cycle.trim()) {
      errors.cycle = "Cycle est obligatoire";
    }

    if (parseFloat(current_value) <= parseFloat(last_maint_value)) {
      errors.current_value = "La valeur actuelle doit être supérieure à la dernière valeur de maintenance.";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("location", location);
      formData.append("model", model);
      formData.append("serial_number", serial_number);
      formData.append("status", status);
      formData.append("image", image);
      formData.append("description", description);
      formData.append("warranty_expiration_date", formatDate(warranty_expiration_date));
      formData.append("cost", cost);
      formData.append("secteur_id", secteur_id);
      formData.append("unit_id", unit_id);
      formData.append("type", type);
      formData.append("cycle", cycle);
      formData.append("cout_unit", cout_unit);
      formData.append("current_value", current_value);
      formData.append("last_maint_value", last_maint_value);

      formData.append("cout_intervention", cout_intervention);
      formData.append("duree_inter", duree_inter);
      formData.append("type_maint", type_maint);
      formData.append("fichier", fichier);
      formData.append("description_inter", description_inter);
      if (date_debut) {
        formData.append("date_debut", formatDate(date_debut));
      } else {
        formData.append("date_debut", "");
      }
      if (date_fin) {
        formData.append("date_fin", formatDate(date_fin));
      } else {
        formData.append("date_fin", "");
      }


      if (last_maint_date) {
        formData.append("last_maint_date", formatDate(last_maint_date));
      } else {
        formData.append("last_maint_date", "");
      }

      formData.append("descriptionprev", descriptionprev);

      await EquipementFinder.put(`/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate('/equipment');
    } catch (err) {
      console.error(err);
    }
  };

  const handleaffecter = async (e) => {
    e.preventDefault();
    setShowTechnicianSelect(false);
    setShowTraiterButton(true);
    try {
      const url = type === 'Produit'
        ? `/backend/api/v1/notifprevunique/${id}`
        : `/backend/api/v1/maintenance_prev/${id}`;

      await axios.put(url, {
        technicien_id: selectedTechnician,
      });
      toast.success('Cette réclamation a été affectée avec succès');
    } catch (err) {
      console.error("Error updating reclamation:", err);
      toast.error('Erreur lors de l\'affectation de la réclamation');
    }
  };

  const handleTabChange = (index) => {
    if (index === 1) {
      setIsMaintenancePreventive(true);
    } else {
      setIsMaintenancePreventive(false);
    }
  };

  const toggleTechnicianSelect = () => {
    setShowTechnicianSelect(!showTechnicianSelect);
    setShowTraiterButton(showTechnicianSelect); // Hide "Traiter" button when showing technician select
  };

  const handleTraiter = async () => {
    setShowStates(true);
    setShowTraitAndAffectButtons(false);
    try {
      const reclamationResponse = await axios.get(`/backend/api/v1/maintenance_prev`);
      const reclamationData = reclamationResponse.data.data.maintenance_prev;
      const matchReclamation = reclamationData.find(maintenance_prev => maintenance_prev.id === id);
  
      if (matchReclamation) {
        const statResponse = await axios.get(` /backend/api/v1/maintenance_prevstate/${matchReclamation.id}`);
        console.log(statResponse);
        const stat = statResponse.data.data.maintenance_prev[0]; // Accessing the first object in the array
        if (stat.state === 'En cours') {
          setShowRapportTab(true);
          setShowEnCoursButton(false);
        }
      }
    } catch (error) {
      console.error("Une erreur s'est produite lors de la récupération de l'état de la réclamation!", error);
    }
  };
  
  const handleAnnuler = () => {
    setShowStates(false);
    setShowTraitAndAffectButtons(true); // Show "Traiter" and "Affecter" buttons
  };

  const handleEnCoursClick = async () => {
    try {
      // Mettre à jour l'état dans la table reclamation
      await axios.put(`/backend/api/v1/state/${id}`, {
        equipement_id: id,
        state: 'En cours'
      });
  
      // Mettre à jour l'état dans la table notifprev si l'équipement_id est présent
      const notifprevResponse = await axios.get(`/backend/api/v1/notifprev`);
      const notifprevData = notifprevResponse.data.data.notifprev;
      const matchNotifPrevId = notifprevData.find(notifprev => notifprev.id === id);
      if (matchNotifPrevId) {
        await axios.put(`/backend/api/v1/state/${matchNotifPrevId.id}`, {
          id: matchNotifPrevId.id,
          state: 'En cours'
        });
      }
      
      // Mettre à jour l'état dans la table maintenance_prev si l'équipement_id est présent
      const maintenancePrevResponse = await axios.get(`/backend/api/v1/maintenance_prev`);
      const maintenancePrevData = maintenancePrevResponse.data.data.maintenance_prev;
      const matchMaintenancePrevId = maintenancePrevData.find(maintenancePrev => maintenancePrev.id === id);
      if (matchMaintenancePrevId) {
        await axios.put(`/backend/api/v1/state/${matchMaintenancePrevId.id}`, {
          id: matchMaintenancePrevId.id,
          state: 'En cours'
        });
      }
      
  
      // Mettre à jour l'état dans la table reclamation si l'équipement_id est présent
      const reclamationResponse = await axios.get(`/backend/api/v1/reclamation`);
      const reclamationData = reclamationResponse.data.data.reclamations;
      const matchReclamationId = reclamationData.find(reclamation => reclamation.equipement_id === id);
      if (matchReclamationId) {
        await axios.put(`/backend/api/v1/state/${matchReclamationId.id}`, {
          equipement_id: matchReclamationId.equipement_id,
          state: 'En cours'
        });
      }
      
      setShowRapportTab(true);
      toast.success('Tous les états ont été mis à jour avec succès.');
    } catch (error) {
      console.error('Error updating states:', error);
      toast.error('Une erreur est survenue lors de la mise à jour des états.');
    }
  };
  
  
  const handleTermineClick = async () => {
    try {
      await axios.put(`/backend/api/v1/state/${id}`, {
        equipement_id: id,
        state: 'Terminée'
      });
  
      // Mettre à jour l'état dans la table notifprev si l'équipement_id est présent
      const notifprevResponse = await axios.get(`/backend/api/v1/notifprev`);
      const notifprevData = notifprevResponse.data.data.notifprev;
      const matchNotifPrevId = notifprevData.find(notifprev => notifprev.id === id);
      if (matchNotifPrevId) {
        await axios.put(`/backend/api/v1/state/${matchNotifPrevId.id}`, {
          id: matchNotifPrevId.id,
          state: 'Terminée'
        });
      }
  
      // Mettre à jour l'état dans la table maintenance_prev si l'équipement_id est présent
      const maintenancePrevResponse = await axios.get(`/backend/api/v1/maintenance_prev`);
      const maintenancePrevData = maintenancePrevResponse.data.data.maintenance_prev;
      const matchMaintenancePrevId = maintenancePrevData.find(maintenancePrev => maintenancePrev.id === id);
      if (matchMaintenancePrevId) {
        await axios.put(`/backend/api/v1/state/${matchMaintenancePrevId.id}`, {
          id: matchMaintenancePrevId.id,
          state: 'Terminée'
        });
      }
  
      // Mettre à jour l'état dans la table reclamation si l'équipement_id est présent
      const reclamationResponse = await axios.get(`/backend/api/v1/reclamation`);
      const reclamationData = reclamationResponse.data.data.reclamations;
      const matchReclamationId = reclamationData.find(reclamation => reclamation.equipement_id === id);
      if (matchReclamationId) {
        await axios.put(`/backend/api/v1/state/${matchReclamationId.id}`, {
          equipement_id: matchReclamationId.equipement_id,
          state: 'Terminée'
        });
      }
  
      toast.success('Votre intervention a été terminée avec succèes.');
      window.location.href = '/maintenance_table_periode';
    } catch (error) {
      console.error('Error updating states:', error);
      toast.error('Une erreur est survenue lors de la mise à jour des états.');
    }
 
 
  };
  

  // State to control visibility of the 'En cours' button
  const [showEnCoursButton, setShowEnCoursButton] = useState(true);
  

  return (
    <div className="content-wrapper">
    <div className="card">
      <div className="card-body">
        <div className="justify-content">
          <form onSubmit={handleSubmit}>
            <div className="d-flex align-items-center">
                        <div className="image-preview" style={{ maxWidth: "100px", maxHeight: "100px" }}>
                            {/* Conditionally render current image */}
                            {image instanceof File ? (
                                <div className="image-container">
                                    <img src={URL.createObjectURL(image)} alt="Uploaded" className="preview-image" />
                                </div>
                            ) : (
                                <div className="image-container">
                                    {image && (
                                        <img src={mediaUrl(image)} alt="Current" className="preview-image" />
                                    )}
                                </div>
                            )}
                            <i className="fas fa-pen edit-icon"></i>
                            <input
                                id="image"
                                type="file"
                                accept=".jpg, .png, .jpeg"
                                onChange={handleImageChange}
                                className="image-input"
                            />
                        </div>
                       
                        <div className="ml-auto"> {/* Utilisation de ml-auto pour centrer les boutons à droite */}
                        {(role === "technician" || role === "admin") && showTraitAndAffectButtons && (
                    <>
                      {showTraiterButton && (
                        <button className="btn btn-info ml-2" onClick={handleTraiter}>
                          Traiter
                        </button>
                      )}
                      <button type="button" onClick={toggleTechnicianSelect} className="btn btn-secondary ml-2">
                        Affecter
                      </button>
                      <Modal
                        isOpen={showTechnicianSelect}
                        onRequestClose={toggleTechnicianSelect}
                        style={customStyles}
                      >
                        <h2>Sélectionner un technicien</h2>
                        <form onSubmit={handleaffecter}>
                          <select
                            value={selectedTechnician}
                            onChange={(e) => setSelectedTechnician(e.target.value)}
                            className="form-control"
                          >
                            <option value="">Sélectionner un technicien</option>
                            {technicien.map(tech => (
                              <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn btn-primary mt-3">Soumettre</button>
                        </form>
                      </Modal>
                    </>
                  )}
                </div>
            
         
                {!showTraitAndAffectButtons && (
              <div className="states-container">
                {showEnCoursButton && (
                  <button type="button" className="btn btn-outline-info ml-2" onClick={handleEnCoursClick}>
                    En cours
                  </button>
                )}
                <button type="button" className="btn btn-outline-success" onClick={handleTermineClick}>Terminée</button>
                <button className="btn btn-danger ml-2" onClick={handleAnnuler}>
                  Annuler
                </button>
              </div>
            )}
              </div>
            </form>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group row mb-4">
                                <label htmlFor="name" className="col-sm-3 col-form-label">Nom</label>
                                <div className="col-sm-7">
                                    <input
                                        type="text"
                                        className={`inputstyle form-control ${errors.name && 'is-invalid'}`}
                                        name="name"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <div className="invalid-feedback">{errors.name}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="model" className="col-sm-3 col-form-label">Modele</label>
                                <div className="col-sm-7">
                                    <input
                                        type="text"
                                        className={`inputstyle form-control ${errors.model && 'is-invalid'}`}
                                        name="model"
                                        id="model"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                    />
                                    <div className="invalid-feedback">{errors.model}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="serial_number" className="col-sm-3 col-form-label">Numero de serie</label>
                                <div className="col-sm-7">
                                    <input
                                        type="text"
                                        className={`inputstyle form-control ${errors.serial_number && 'is-invalid'}`}
                                        placeholder="Exemple: 123456789"
                                        name="serial_number"
                                        value={serial_number}
                                        onChange={(e) => setSerial_number(e.target.value)}
                                    />
                                    <div className="invalid-feedback">{errors.serial_number}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="status" className="col-sm-3 col-form-label">Status</label>
                                <div className="col-sm-7">
                                    <select
                                        className={`inputstyle form-control `}
                                        name="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">Sélectionnez status</option>
                                        <option value="active">Actif</option>
                                        <option value="inactive">Inactif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="showWarranty" className="col-sm-3 col-form-label">Garantie valable</label>
                                <div className="col-sm-7">
                                    <input
                                        type="checkbox"
                                        id="showWarranty"
                                        checked={showWarranty}
                                        onChange={(e) => {
                                            setShowWarranty(e.target.checked);
                                            setIsWarrantyRequired(e.target.checked);
                                            if (!e.target.checked) {
                                                setWarranty_expiration_date(""); // Clear the date if warranty is unchecked
                                            }
                                        }}            />
                                    {showWarranty && (
                                        <div className="form-group mt-2">
                                            <label htmlFor="warranty_expiration_date">Date fin-Garantie</label>
                                            <input
                                                type="date"
                                                className={`inputstyle ${errors.warranty_expiration_date && 'is-invalid'}`}
                                                name="warranty_expiration_date"
                                                value={warranty_expiration_date}
                                                onChange={(e) => setWarranty_expiration_date(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]} // Set min date to current date
                                            />
                                            {errors.warranty_expiration_date && <div className="invalid-feedback">{errors.warranty_expiration_date}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group row mb-4">
                                <label htmlFor="location" className="col-sm-3 col-form-label">Constructeur</label>
                                <div className="col-sm-7">
                                    <input
                                        type="text"
                                        className={`inputstyle form-control `}
                                        placeholder="yamazaki Mazak"
                                        name="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="secteur_id" className="col-sm-3 col-form-label">Secteur</label>
                                <div className="col-sm-7">
                                    <select
                                        className={`inputstyle form-control  ${errors.secteur_id && 'is-invalid'}`}
                                        value={secteur_id}
                                        onChange={(e) => setSecteur_id(e.target.value)}
                                    >
                                        <option value="">Sélectionnez le secteur</option>
                                        {secteurs.map(secteur => (
                                            <option key={secteur.id} value={secteur.id}>
                                                {secteur.lib}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="invalid-feedback">{errors.secteur_id}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="type" className="col-sm-3 col-form-label">Type</label>
                                <div className="col-sm-7">
                                    <select
                                        className={`inputstyle form-control `}
                                        name="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="">Sélectionnez type</option>
                                        <option value="Produit">Produit</option>
                                        <option value="Periode">Periode</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="cycle" className="col-sm-3 col-form-label">Cycle</label>
                                <div className="col-sm-7">
                                    <input
                                        type="Number"
                                        className={`inputstyle form-control ${errors.cycle && 'is-invalid'}`}
                                        name="cycle"
                                        value={cycle}
                                        onChange={(e) => setCycle(e.target.value)}
                                    />
                                    <div className="invalid-feedback">{errors.cycle}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="unit_id" className="col-sm-3 col-form-label">Unité</label>
                                <div className="col-sm-7">
                                    <select
                                        className={`inputstyle form-control  ${errors.unit_id && 'is-invalid'}`}
                                        value={unit_id}
                                        onChange={(e) => setUnit_id(e.target.value)}
                                    >
                                        <option value="">Sélectionnez une unité</option>
                                        {units.map(unity => (
                                            <option key={unity.id} value={unity.id}>
                                                {unity.unit}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="invalid-feedback">{errors.unit_id}</div>
                                </div>
                            </div>
                            <div className="form-group row mb-4">
                                <label htmlFor="description" className="col-sm-3 col-form-label">Description</label>
                                <div className="col-sm-7">
                                    <input
                                        type="text"
                                        className="inputstyle form-control "
                                        placeholder="Exemple: Machine de découpe laser"
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <Tabs onSelect={handleTabChange}>
  <TabList>
    <Tab>Coût</Tab>
    <Tab>Maintenance préventive</Tab>
    {showRapportTab && <Tab>Rapport de l'intervention</Tab>}
  </TabList>
  <TabPanel>
    <div className="form-group row mb-4">
      <label htmlFor="cost" className="col-sm-2 col-form-label">Coût de l'amortissement</label>
      <div className="col-sm-4">
        <input
          type="Number"
          className={`inputstyle form-control`}
          name="cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
      </div>
    </div>
    <div className="form-group row mb-4">
      <label htmlFor="cout_unit" className="col-sm-2 col-form-label">Coût unitaire</label>
      <div className="col-sm-4">
        <input
          type="Number"
          className={`inputstyle form-control `}
          name="cout_unit"
          value={cout_unit}
          onChange={(e) => setCout_unit(e.target.value)}
        />
      </div>
    </div>
  </TabPanel>
  <TabPanel>
    {type === 'Periode' ? (
      <div className="row">
        <div className="col-md-6">
          <div className="form-group row mb-4">
            <label htmlFor="last_maint_date" className="col-sm-3 col-form-label">Dernière Date de la maintenance</label>
            <div className="col-sm-5">
              <input
                type="datetime-local"
                className={`inputstyle form-control ${errors.last_maint_date && 'is-invalid'}`}
                placeholder=""
                name="last_maint_date"
                value={last_maint_date}
                onChange={(e) => formatDate(e.target.value)}
              />
              <div className="invalid-feedback">{errors.last_maint_date}</div>
            </div>
          </div>
          <div className="form-group row mb-4">
            <label htmlFor="descriptionprev" className="col-sm-3 col-form-label">Description</label>
            <div className="col-sm-5">
              <input
                type="text"
                className={`inputstyle form-control`}
                placeholder=""
                name="descriptionprev"
                value={descriptionprev}
                onChange={(e) => setDescriptionprev(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="row">
        <div className="col-md-6">
          <div className="form-group row mb-4">
            <label htmlFor="current_value" className="col-sm-3 col-form-label">Valeur actuelle</label>
            <div className="col-sm-5">
              <input
                type="Number"
                className={`inputstyle form-control ${errors.current_value && 'is-invalid'}`}
                placeholder=""
                name="current_value"
                value={current_value}
                onChange={(e) => setCurrent_value(e.target.value)}
              />
              <div className="invalid-feedback">{errors.current_value}</div>
            </div>
          </div>
          <div className="form-group row mb-4">
            <label htmlFor="last_maint_value" className="col-sm-3 col-form-label">Dernière valeur de la maintenance</label>
            <div className="col-sm-5">
              <input
                type="Number"
                className={`inputstyle form-control ${errors.last_maint_value && 'is-invalid'}`}
                placeholder=""
                name="last_maint_value"
                value={last_maint_value}
                onChange={(e) => setLast_maint_value(e.target.value)}
                disabled
              />
              <div className="invalid-feedback">{errors.current_value}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group row mb-4">
            <label htmlFor="last_maint_date" className="col-sm-3 col-form-label">Dernière Date de la maintenance</label>
            <div className="col-sm-5">
              <input
                type="datetime-local"
                className={`inputstyle form-control `}
                placeholder=""
                name="last_maint_date"
                value={last_maint_date}
                onChange={(e) => formatDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group row mb-4">
            <label htmlFor="descriptionprev" className="col-sm-3 col-form-label">Description</label>
            <div className="col-sm-5">
              <input
                type="text"
                className={`inputstyle form-control`}
                placeholder=""
                name="descriptionprev"
                value={descriptionprev}
                onChange={(e) => setDescriptionprev(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </TabPanel>
  {showRapportTab && (
    <TabPanel>
        <div className="row">
        <div className="col-md-6">
    <div className="form-group row mb-4">
      <label htmlFor="cout_intervention" className="col-sm-4 col-form-label">Coût d'intervention DT</label>
      <div className="col-sm-4">
        <input
          type="Number"
          className={`inputstyle form-control`}
          name="cout_intervention"
          value={cout_intervention}
          onChange={(e) => setCout_intervention(e.target.value)}
        />
      </div>
    </div>
    <div className="form-group row mb-4">
      <label htmlFor="duree_inter" className="col-sm-4 col-form-label">Durée_inter</label>
      <div className="col-sm-4">
        <input
          type="text"
          className={`inputstyle form-control `}
          name="duree_inter"
          placeholder="..(minute,heure,jours) "
          value={duree_inter}
          onChange={(e) => setDuree_inter(e.target.value)}
        />
      </div>
    </div>  
    <div className="form-group row mb-4">
      <label htmlFor="type_maint" className="col-sm-4 col-form-label">Type_maint</label>
      <div className="col-sm-4">
        <input
          type="text"
          className={`inputstyle form-control`}
          name="type_maint"
          value={type_maint}
          onChange={(e) => setType_maint(e.target.value)}
        />
         {errors.type_maint && <div className="text-danger">{errors.type_maint}</div>}
      </div>
    </div>
    </div>
    <div className="col-md-6">
    <div className="form-group row mb-4">
            <label htmlFor="date_debut" className="col-sm-3 col-form-label">Debut maintenance</label>
            <div className="col-sm-5">
              <input
                type="datetime-local"
                className={`inputstyle form-control `}
                placeholder=""
                name="date_debut"
                value={date_debut}
                onChange={(e) => formatDate(setDate_debut(e.target.value))}
              />
              {errors.date_debut && <div className="text-danger">{errors.date_debut}</div>}
            </div>
          </div>
          <div className="form-group row mb-4">
            <label htmlFor="date_fin" className="col-sm-3 col-form-label">date fin de maintenance</label>
            <div className="col-sm-5">
            <input
                     type="datetime-local"
                      id="date_fin"
                      className="inputstyle form-control"
                      value={date_fin}
                      onChange={(e) => setDate_fin(e.target.value)}
                    />

               {errors.date_fin && <div className="text-danger">{errors.date_fin}</div>}
            </div>
          </div>
          </div>
    </div>
      </TabPanel>
  )}
</Tabs>


                
<div className="d-flex justify-content-end mt-4">
    <button type="submit" className="btn btn-primary mr-2">
        Enregistrer
    </button>
    <button onClick={() => navigate('/equipment')} className="btn btn-danger">
        Fermer
    </button>
</div>
              </div>
            </div>
        </div>
    </div>
);
};


export default UpdateEquipperiode;
