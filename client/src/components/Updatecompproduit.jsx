import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
Modal.setAppElement('#root'); // Set the root element for accessibility


const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours().toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCurrentDateTimePlusOneHour = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().substring(0, 16);
};

function Updatecompproduit (){
    const { id } = useParams();
    const [id_equip, setIdequip] = useState("");
    const [name_equip, setNameEquip] = useState("");
    const [name_comp, setNameComp] = useState("");
    const [reference, setReference] = useState("");
    const [type, setType] = useState("Produit");
    const [cycle, setCycle] = useState("");
    const [unit_id, setUnit_id] = useState("");
    const [current_value, setCurrentValue] = useState("");
    const [lastMaintValue, setLastMaintValue] = useState("");
    const [last_maint_date, setLastMaintDate] = useState(getCurrentDateTimePlusOneHour());
    const [nextMaintDate, setNextMaintDate] = useState("");
    const [description, setDescription] = useState("");
    const [fichier, setFichier] = useState(null);
    const [units, setUnits] = useState([]);
    const [message, setMessage] = useState('');
    const [auth, setAuth] = useState(false);
    const [technicien, setTechniciens] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
    const [showStates, setShowStates] = useState(false); 
    const [notifprev, setNotifprevs] = useState([]);


    const [showTraiterButton, setShowTraiterButton] = useState(true);
    const [showTraitAndAffectButtons, setShowTraitAndAffectButtons] = useState(true);
    const [showRapportTab, setShowRapportTab] = useState(false);
    const [cout_intervention, setCout_intervention] = useState(0);
    const [duree_inter, setDuree_inter] = useState(0);
    const [type_maint, setType_maint] = useState("");
    const [date_debut, setDate_debut] = useState("");
    const [date_fin, setDate_fin] = useState("");
    const [description_inter, setDescription_inter] = useState("");
    const [role, setRole] = useState('');
    const navigate = useNavigate();
  
    const [errors, setErrors] = useState({
       
        cout_intervention: "",
        duree_inter: "",
        type_maint: "",
        date_debut: "",
        date_fin: "",
        description_inter: "",
      });

    axios.defaults.withCredentials = true;
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
            const composantResponse = await axios.get(`/backend/api/v1/composant/${id}`);
            const composantData = composantResponse.data.data.composant;
         
            setNameEquip(composantData.name_equip);
            setNameComp(composantData.name_comp);
            setReference(composantData.reference);
            setType(composantData.type);
            setCycle(composantData.cycle);
            setUnit_id(composantData.unit_id);
            setCurrentValue(composantData.current_value);
            setLastMaintValue(composantData.last_maint_value);
            if (composantData.last_maint_date) {
                const beginDate = new Date(composantData.last_maint_date);
                const offset = beginDate.getTimezoneOffset();
                beginDate.setMinutes(beginDate.getMinutes() - offset);
                const formattedDate = formatDate(beginDate.toISOString().slice(0, 16));
                setLastMaintDate(formattedDate);
            } else {
                setLastMaintDate("");
            }
            setDescription(composantData.description);
            // Set other state values accordingly
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
       
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
        const notifprevsResponse = await axios.get('/backend/api/v1/notifprevcomp');
        setNotifprevs(notifprevsResponse.data.data.notifprevcomp);
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
    try {
        // Assumed that equipement data is available
        const formData = new FormData();
        formData.append('id_equip', id_equip);
        formData.append('name_equip', name_equip);
        formData.append('name_comp', name_comp);
        formData.append('reference', reference);
        formData.append('type', type);
        formData.append('cycle', cycle);
        formData.append('unit_id', unit_id);
        formData.append('current_value', current_value);
        formData.append('last_maint_value', lastMaintValue);
        
        if (last_maint_date) {
            formData.append("last_maint_date", formatDate(last_maint_date));
        } else {
            formData.append("last_maint_date", "");
        }
        formData.append('next_maint_date', nextMaintDate);
        formData.append('description', description);
        if (fichier) formData.append('file', fichier);

        const response = await axios.put(`/backend/api/v1/composant/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log(response.data);
       
    } catch (err) {
        console.error(err);
    }
};

const handleDocumentChange = (e) => {
    setFichier(e.target.files[0]);
};

  const handleaffecter = async (e) => {
    e.preventDefault();
    setShowTechnicianSelect(false);
    setShowTraiterButton(true);
    try {
      const url = type === 'Produit'
        ? `/backend/api/v1/notifprevuniquecomp/${id}`
        : `/backend/api/v1/maintenance_prevcomp/${id}`;

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
      const reclamationResponse = await axios.get(`/backend/api/v1/notifprevcompunique`);
      const reclamationData = reclamationResponse.data.data.notifprevcompunique;
      const matchReclamation = reclamationData.find(notifprevcompunique => notifprevcompunique.id === id);
  
      if (matchReclamation) {
        const statResponse = await axios.get(` /backend/api/v1/notifprevcompuniquestate/${matchReclamation.id}`);
        console.log(statResponse);
        const stat = statResponse.data.data.notifprevcompunique[0]; // Accessing the first object in the array
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
      await axios.put(`/backend/api/v1/statecomp/${id}`, {
        composant_id: id,
        state: 'En cours'
      });
  
      // Mettre à jour l'état dans la table notifprev si l'équipement_id est présent
      const notifprevResponse = await axios.get(`/backend/api/v1/notifprevcomp`);
      const notifprevData = notifprevResponse.data.data.notifprevcomp;
      const matchNotifPrevId = notifprevData.find(notifprevcomp => notifprevcomp.id === id);
      if (matchNotifPrevId) {
        await axios.put(`/backend/api/v1/statecomp/${matchNotifPrevId.id}`, {
          id: matchNotifPrevId.id,
          state: 'En cours'
        });
      }
      
      // Mettre à jour l'état dans la table maintenance_prev si l'équipement_id est présent
      const maintenancePrevResponse = await axios.get(`/backend/api/v1/maintenance_prevcomp`);
      const maintenancePrevData = maintenancePrevResponse.data.data.maintenance_prevcomp;
      const matchMaintenancePrevId = maintenancePrevData.find(maintenancePrevcomp => maintenancePrevcomp.id === id);
      if (matchMaintenancePrevId) {
        await axios.put(`/backend/api/v1/statecomp/${matchMaintenancePrevId.id}`, {
          id: matchMaintenancePrevId.id,
          state: 'En cours'
        });
      }
      
  
      // Mettre à jour l'état dans la table reclamation si l'équipement_id est présent
      const reclamationResponse = await axios.get(`/backend/api/v1/reclamation`);
      const reclamationData = reclamationResponse.data.data.reclamations;
      const matchReclamationId = reclamationData.find(reclamation => reclamation.composant_id === id);
      if (matchReclamationId) {
        await axios.put(`/backend/api/v1/statecomp/${matchReclamationId.id}`, {
          composant_id: matchReclamationId.composant_id,
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
    const errors = {};
   
   
   
if (!type_maint || !type_maint.trim()) {
  errors.type_maint = "Le type de maintenance est obligatoire";
}
if (!date_debut || !date_debut.trim()) {
  errors.date_debut = "La date de début est obligatoire";
}
if (!date_fin || !date_fin.trim()) {
  errors.date_fin = "La date de fin est obligatoire";
}

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fill in all the required fields.');
      return;
    }
    try {
      await axios.put(`/backend/api/v1/statecomp/${id}`, {
        composant_id: id,
        state: 'Terminée'
      });
  
      // Mettre à jour l'état dans la table notifprev si l'équipement_id est présent
      const notifprevResponse = await axios.get(`/backend/api/v1/notifprevcomp`);
      const notifprevData = notifprevResponse.data.data.notifprevcomp;
      const matchNotifPrevId = notifprevData.find(notifprevcomp => notifprevcomp.id === id);
      if (matchNotifPrevId) {
        await axios.put(`/backend/api/v1/statecomp/${matchNotifPrevId.id}`, {
          id: matchNotifPrevId.id,
          state: 'Terminée'
        });
      }
  
      // Mettre à jour l'état dans la table maintenance_prev si l'équipement_id est présent
      const maintenancePrevResponse = await axios.get(`/backend/api/v1/maintenance_prevcomp`);
      const maintenancePrevData = maintenancePrevResponse.data.data.maintenance_prevcomp;
      const matchMaintenancePrevId = maintenancePrevData.find(maintenance_prevcomp => maintenance_prevcomp.id === id);
      if (matchMaintenancePrevId) {
        await axios.put(`/backend/api/v1/statecomp/${matchMaintenancePrevId.id}`, {
          id: matchMaintenancePrevId.id,
          state: 'Terminée'
        });
      }
  
      // Mettre à jour l'état dans la table reclamation si l'équipement_id est présent
      const reclamationResponse = await axios.get(`/backend/api/v1/reclamation`);
      const reclamationData = reclamationResponse.data.data.reclamations;
      const matchReclamationId = reclamationData.find(reclamation => reclamation.composant_id === id);
      if (matchReclamationId) {
        await axios.put(`/backend/api/v1/statecomp/${matchReclamationId.id}`, {
         composant_id: matchReclamationId.composant_id,
          state: 'Terminée'
        });
      }
  
      toast.success('Votre intervention a été terminée avec succèes.');
      navigate("/reclamation");
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
              
                <div className="ml-auto">
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
            <br></br><br></br>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group row mb-4">
                <label htmlFor="name_equip" className="col-sm-3 col-form-label">Nom de l'équipement</label>
                                        <div className="col-sm-7">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name_equip"
                                                value={name_equip}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="name_comp" className="col-sm-3 col-form-label">Nom du Composant</label>
                                        <div className="col-sm-7">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name_comp"
                                                value={name_comp}
                                                onChange={(e) => setNameComp(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="reference" className="col-sm-3 col-form-label">Référence</label>
                                        <div className="col-sm-7">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="reference"
                                                value={reference}
                                                onChange={(e) => setReference(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group row mb-4">
                                        <label htmlFor="type" className="col-sm-3 col-form-label">Type</label>
                                        <div className="col-sm-7">
                                            <select
                                                className="form-control"
                                                id="type"
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                            >
                                                <option value="Produit">Produit</option>
                                                <option value="Periode">Periode</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="cycle" className="col-sm-3 col-form-label">Cycle</label>
                                        <div className="col-sm-7">
                                            <input
                                                type="number"
                                                className="form-control"
                                                id="cycle"
                                                value={cycle}
                                                onChange={(e) => setCycle(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="setUnit_id" className="col-sm-3 col-form-label">Unité</label>
                                        <div className="col-sm-7">
                                            <select
                                                className="form-control"
                                                id="setUnit_id"
                                                value={unit_id}
                                                onChange={(e) => setUnit_id(e.target.value)}
                                            >
                                                {units.map(unit => (
                                                    <option key={unit.id} value={unit.id}>
                                                        {unit.unit}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Tabs>
                                <TabList>
                                    <Tab>Maintenance</Tab>
                                    <Tab>Note</Tab>
                                    <Tab>Instructions</Tab>
                                    {showRapportTab && <Tab>Rapport de l'intervention</Tab>}
                                </TabList>
                                <TabPanel>
                                    <div className="row">
                                        <div className="col-md-6">
                                            {type === "Produit" && (
                                                <>
                                                    <div className="form-group row mb-4">
                                                        <label htmlFor="current_value" className="col-sm-3 col-form-label">Valeur Actuelle</label>
                                                        <div className="col-sm-7">
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                id="current_value"
                                                                value={current_value}
                                                                onChange={(e) => setCurrentValue(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row mb-4">
                                                        <label htmlFor="lastMaintValue" className="col-sm-3 col-form-label">Dernière Valeur de Maintenance</label>
                                                        <div className="col-sm-7">
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                id="lastMaintValue"
                                                                value={lastMaintValue}
                                                                onChange={(e) => setLastMaintValue(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <div className="form-group row mb-4">
                                                <label htmlFor="last_maint_date" className="col-sm-3 col-form-label">Date de Dernière Maintenance</label>
                                                <div className="col-sm-7">
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        id="last_maint_date"
                                                        value={last_maint_date}
                                                        onChange={(e) => setLastMaintDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                           
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="description" className="col-sm-2 col-form-label">Description</label>
                                        <div className="col-sm-12">
                                            <textarea
                                                className="form-control"
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel>
                                    <div className="form-group row mb-4">
                                        <label htmlFor="fichier" className="col-sm-1 col-form-label">Fichier <i className="fas fa-paperclip"></i></label>
                                        <div className="col-sm-3">
                                            <input
                                                type="file"
                                                className="form-control-file"
                                                id="fichier"
                                                onChange={handleDocumentChange}
                                                accept=".pdf,.doc,.docx"
                                            />
                                        </div>
                                    </div>
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

            </div>
          </div>
</div>
    </div>
      </TabPanel>
  )}
                            </Tabs>
                            <div className="d-flex justify-content-end mt-4">
  
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
export default Updatecompproduit;