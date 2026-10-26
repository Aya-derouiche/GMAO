import React, { useState, useContext, useEffect } from "react";
import EquipementFinder from '../apis/EquipementFinder';
import { EquipementsContext } from '../context/EquipementsContext';
import axios from 'axios';
import './Equipementadd.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Navigate, Link  } from "react-router-dom";


const AddEquipement = () => {
    const { addEquipements } = useContext(EquipementsContext);
    const [refresh, setRefresh] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [model, setModel] = useState("");
    const [serial_number, setSerial_number] = useState("");
    const [status, setStatus] = useState("active"); // Default value for status
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState("");
    const [warranty_expiration_date, setWarranty_expiration_date] = useState("");
    const [cost, setCost] = useState(0);
    const [cout_unit, setCout_unit] = useState(0);
    const [secteur_id, setSecteur_id] = useState("");
    const [secteurs, setSecteurs] = useState([]);
    const [secteurLoadError, setSecteurLoadError] = useState("");
    const [unit_id, setUnit_id] = useState("");
    const [units, setUnits] = useState([]);
    const [unitLoadError, setUnitLoadError] = useState("");
    const [type, setType] = useState("Produit"); // Default value for type
    const [cycle, setCycle] = useState("");
    const [showWarranty, setShowWarranty] = useState(false);
    const [isWarrantyRequired, setIsWarrantyRequired] = useState(false);
    const [current_value, setCurrent_value] = useState(0);
    const [last_maint_value, setLast_maint_value] = useState(0);
    const [last_maint_date, setLast_maint_date] = useState("");
    const [descriptionprev, setDescriptionprev] = useState("");
    const [isMaintenancePreventive, setIsMaintenancePreventive] = useState(false);
    const [fichier, setFichier] = useState(null);
    const [errors, setErrors] = useState({
        name: "",
        location: "",
        model: "",
        serial_number: "",
        status: "",
        warranty_expiration_date: "",
        secteur_id: "",
        type:"",
        cycle:"",
        current_value,
        last_maint_value,
        last_maint_date
     
    });

    useEffect(() => {
        if (refresh) {
            window.location.reload();
            setRefresh(false);
        }
    }, [refresh]);
    
    useEffect(() => {
        let active = true;
        axios.get("/backend/api/v1/secteur")
            .then((response) => {
                const rows = response.data?.data?.secteurs;
                if (!Array.isArray(rows)) {
                    throw new Error("Réponse API secteurs invalide.");
                }
                if (active) {
                    setSecteurs(rows);
                    setSecteurLoadError("");
                }
            })
            .catch((error) => {
                console.error("Impossible de charger les secteurs:", error);
                if (active) setSecteurLoadError(error.response?.data?.message || error.message);
            });

        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        const unitsEndpoint = type === "Produit" ? "unitproduit" : "unitperiode";
        axios.get(`/backend/api/v1/${unitsEndpoint}`)
            .then((response) => {
                const rows = response.data?.data?.unit;
                if (!Array.isArray(rows)) {
                    throw new Error("Réponse API unités invalide.");
                }
                if (active) {
                    setUnits(rows);
                    setUnit_id("");
                    setUnitLoadError("");
                }
            })
            .catch((error) => {
                console.error("Impossible de charger les unités:", error);
                if (active) {
                    setUnits([]);
                    setUnitLoadError(error.response?.data?.message || error.message);
                }
            });

        return () => { active = false; };
    }, [type]);
    
    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };
 
    const handleTabChange = (index) => {
        if (index === 1) { // Assuming index 1 corresponds to the Maintenance Préventive tab
            setIsMaintenancePreventive(true);
        } else {
            setIsMaintenancePreventive(false);
        }
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
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
      
        if (isWarrantyRequired && !warranty_expiration_date) {
            errors.warranty_expiration_date = "Date fin-Garantie est obligatoire";
        }
        if (description && !description.trim()) {
            errors.description = "Description est obligatoire";
        }
       
        if (!secteur_id.trim()) {
            errors.secteur_id = "Secteur est obligatoire";
        }
       
        if (!cycle.trim()) {
            errors.cycle = "Cycle est obligatoire";
        }

        if (current_value && !current_value) {
            errors.current_value = "Valeur actuelle est obligatoire";
        }
      

     


        
        if (last_maint_date && !last_maint_date.trim()) {
            errors.last_maint_date = "Dernier date de maintenance est obligatoire";
        }

        // If there are errors, set them and prevent form submission
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

        // Check if serial number already exists
        try {
            const response = await axios.get(`/backend/api/v1/check-serial-number_add?serial_number=${serial_number}`);
            // If serial number exists, handle it
            if (response.data.error) {
                errors.serial_number = response.data.error;
                setErrors(errors);
                return; // Stop form submission if serial number already exists
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 400) {
                errors.serial_number = "Ce numéro de série existe déjà";
                setErrors(errors);
            }
            return;
        }

        // If no errors, proceed with form submission
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("location", location);
            formData.append("model", model);
            formData.append("serial_number", serial_number);
            formData.append("status", status);
            formData.append("image", image);
            formData.append("description", description);
            formData.append("warranty_expiration_date", warranty_expiration_date);
            formData.append("cost", cost);
            formData.append("secteur_id", secteur_id);
            formData.append("unit_id", unit_id);
            formData.append("type", type);
            formData.append("cycle", cycle);
            formData.append("cout_unit", cout_unit);
            formData.append("current_value", current_value);
            formData.append("last_maint_value", last_maint_value);
            formData.append("last_maint_date", last_maint_date);
            formData.append("descriptionprev", descriptionprev);
            if (fichier) formData.append('file', fichier);
            const response = await EquipementFinder.post("/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            addEquipements(response.data.data.equipement);
            clearForm();
            setRefresh(true); 
          Navigate('/equipment')
          
        } catch (err) {
            console.log(err);
        }
    };
    const handleDocumentChange = (e) => {
        setFichier(e.target.files[0]);
    };
    const clearForm = () => {
        setName("");
        setLocation("");
        setModel("");
        setSerial_number("");
       
        setImage(null);
        setDescription("");
        setWarranty_expiration_date("");
        setCost("");
        setSecteur_id("");
        setUnit_id("");
        setCout_unit("");
        setCurrent_value("");
        setLast_maint_value("");
        setLast_maint_date("");
        setDescriptionprev("");
        setFichier(null);
        setErrors({
            name: "",
            location: "",
            model: "",
            serial_number: "",
            warranty_expiration_date: "",
            cost: "",
            secteur_id: "",
            unit_id: "",
            current_value: "",
            last_maint_value: "",
            last_maint_date: "",
            descriptionprev: ""

        });
    };

    const handleCancel = () => {
        clearForm();
    };
    return (
    <div className="content-wrapper">
         <div className="row">
              
                <div className="col-sm-4 text-center">
                <h5 className="card-title">
                                <Link to="/equipment">Liste machines</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                <Link to="">Ajout nouveau machine</Link>
                              
                            </h5>
</div>
</div>
           
    <div className="card">
        <div className="card-body">
            <div className=" justify-content">
                <form onSubmit={handleSubmit}>
                    <div className="d-flex align-items-center"> {/* Nouvelle div parente */}
                        <div className="image-preview" style={{ maxWidth: "100px", maxHeight: "100px" }}>
                            {image ? (
                                <div className="image-container">
                                    <img src={URL.createObjectURL(image)} alt="Uploaded" className="preview-image" />
                                </div>
                            ) : (
                                <div className="placeholder">
                                    <label htmlFor="image-input" className="upload-label">
                                        <i className="fas fa-image"></i>
                                        <i className="fas fa-pen edit-icon"></i>
                                        <input
                                            id="image-input"
                                            type="file"
                                            accept=".jpg, .png, .jpeg"
                                            onChange={handleImageChange}
                                            className="image-input"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="ml-auto"> {/* Utilisation de ml-auto pour centrer les boutons à droite */}
                            <button type="submit" className="btn btn-primary mr-2">
                                Ajouter
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                Annuler
                            </button>
                        </div>
                        </div>       <br />
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group row mb-4">
                                        <label htmlFor="name" className="col-sm-3 col-form-label">Nom</label>
                                        <div className="col-sm-7">
                                            <input 
                                                type="text"
                                                className={`inputstyle form-control ${errors.name && 'is-invalid'}`}
                                                placeholder=""
                                                name="name"
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
                                                placeholder=""
                                                name="model"
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
                                                placeholder=""
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
                                            <label htmlFor="location" className="col-sm-3 col-form-label">Fabricant</label>
                                            <div className="col-sm-7">
                                                <input
                                                    type="text"
                                                    className={`inputstyle form-control `}
                                                    placeholder=""
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
                                                {secteurLoadError && <small className="text-danger">Chargement des secteurs impossible : {secteurLoadError}</small>}
                                                <div className="invalid-feedback">{errors.secteur_id}</div>
                                            </div>
                                     
                                        </div>
                                        <div className="form-group row mb-4">
                                            <label htmlFor="type" className="col-sm-3 col-form-label">Cycle de maintenance par</label>
                                            <div className="col-sm-7">
                                                <select
                                                    className={`inputstyle form-control `}
                                                    name="type"
                                                    value={type}
                                                    onChange={(e) => setType(e.target.value)}
                                                >
                                                    <option value="Produit">Produit</option>
                                                    <option value="Periode">Periode</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group row mb-4">
                                            <label htmlFor="cycle" className="col-sm-3 col-form-label">Longeur de cycle</label>
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
                                            <label htmlFor="unit_id" className="col-sm-3 col-form-label">Unité de cycle</label>
                                            <div className="col-sm-7">
                                                <select
                                                    className={`inputstyle form-control  ${errors.unit_id && 'is-invalid'}`}
                                                    value={unit_id}
                                                    onChange={(e) => setUnit_id(e.target.value)}
                                                >
                                                    <option value="">Sélectionnez une unité</option>
                                                    {units.map(unit => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {unit.unit}
                                                        </option>
                                                    ))}
                                                </select>
                                                {unitLoadError && <small className="text-danger">Chargement des unités impossible : {unitLoadError}</small>}
                                                <div className="invalid-feedback">{errors.unit_id}</div>
                                            </div>
                                     
                                        </div>
                                        
                                    </div>
                                </div>
                                <Tabs onSelect={handleTabChange}>
                                <TabList>
                                    <Tab>Coût</Tab>
                                    <Tab>Maintenence préventive</Tab>
                                    <Tab>Note</Tab>
                                    <Tab>Instructions</Tab> 
                                </TabList>
                                <TabPanel>
                                
                                    {/* Content for Coût tab */}
                                    <div className="form-group row mb-4">
                                        <label htmlFor="cost" className="col-sm-2 col-form-label">Coût de l'amortissement</label>
                                        <div className="col-sm-4">
                                            <input
                                                type="Number"
                                                className={`inputstyle form-control`}
                                                placeholder=""
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
                                                placeholder=""
                                                name="cout_unit"
                                                value={cout_unit}
                                                onChange={(e) => setCout_unit(e.target.value)}
                                            />
*                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel>
                                {type === 'Periode' ? (
        <div className="row">
            <div className="col-md-6">

<div className="form-group row mb-4">
    <label htmlFor="last_maint_date" className="col-sm-3 col-form-label">Dernier Date de la maintenance</label>
    <div className="col-sm-5">
        <input
            type="datetime-local"
            className={`inputstyle form-control ${errors.last_maint_date && 'is-invalid'}`}
            placeholder=""
            name="last_maint_date"
            value={last_maint_date}
            onChange={(e) => setLast_maint_date(e.target.value)}
        /> 
        <div className="invalid-feedback">{errors.last_maint_date}</div>
    </div>
</div>

<div className="form-group row mb-4">
    <label htmlFor="descriptionprev" className="col-sm-3 col-form-label">Description maintenance</label>
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
                                        <label htmlFor="last_maint_value" className="col-sm-3 col-form-label">Dernier valeur de la maintenance</label>
                                        <div className="col-sm-5">
                                            <input
                                                type="Number"
                                                className={`inputstyle form-control `}
                                                placeholder=""
                                                name="last_maint_value"
                                                value={last_maint_value}
                                                onChange={(e) => setLast_maint_value(e.target.value)}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    </div>
                                    <div className="col-md-6">

                                    <div className="form-group row mb-4">
                                        <label htmlFor="last_maint_date" className="col-sm-3 col-form-label">Dernier Date de la maintenance</label>
                                        <div className="col-sm-5">
                                            <input
                                                type="datetime-local"
                                                className={`inputstyle form-control ${errors.last_maint_date && 'is-invalid'}`}
                                                placeholder=""
                                                name="last_maint_date"
                                                value={last_maint_date}
                                                onChange={(e) => setLast_maint_date(e.target.value)}
                                            />
                                            <div className="invalid-feedback">{errors.last_maint_date}</div>
                                        </div>
                                    </div>

                                    <div className="form-group row mb-4">
                                        <label htmlFor="descriptionprev" className="col-sm-3 col-form-label">Description maintenance</label>
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
                                <TabPanel>
                                <div className="form-group row mb-4">
  <label htmlFor="descriptionprev" className=" col-form-label">Description</label>
  <div className="col-sm-7">
    <textarea 
      className="input form-control"
      placeholder=""
      name="descriptionprev"
      value={descriptionprev}
      onChange={(e) => setDescriptionprev(e.target.value)}
      rows="4"
     
    />
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
                            </Tabs>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default AddEquipement;
