import React, { useEffect, useState, useContext } from "react";
import EquipementFinder from '../apis/EquipementFinder';
import { EquipementsContext } from '../context/EquipementsContext';
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const getCurrentDateTimePlusOneHour = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().substring(0, 16);
};

function Addcomposant2() {
    const [equipement, setEquipement] = useState(null);
    const [nameComp, setNameComp] = useState("");
    const [reference, setReference] = useState("");
    const [type, setType] = useState("");
    const [cycle, setCycle] = useState("");
    const [unit_id, setUnit_id] = useState("");
    const [currentValue, setCurrentValue] = useState("");
    const [lastMaintValue, setLastMaintValue] = useState(0);
    const [lastMaintDate, setLastMaintDate] = useState(getCurrentDateTimePlusOneHour());
    const [nextMaintDate, setNextMaintDate] = useState("");
    const [description, setDescription] = useState("");
    const [fichier, setFichier] = useState(null);
    const [units, setUnits] = useState([]);
    const [errors, setErrors] = useState({});
    const [lastMaintDateTouched, setLastMaintDateTouched] = useState(false); // Track if last maintenance date field has been touched

    const navigate = useNavigate();
    const { name } = useParams();
    const { equipements, setEquipements } = useContext(EquipementsContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const equipementResponse = await EquipementFinder.get(`/equipementName/${name}`);
                setEquipement(equipementResponse.data.data.equipement);
                setType(equipementResponse.data.data.equipement.type);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [name]);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                let unitsResponse;
                if (type === 'Produit') {
                    unitsResponse = await axios.get("http://localhost:3001/api/v1/unitproduit");
                } else if (type === 'Periode') {
                    unitsResponse = await axios.get("http://localhost:3001/api/v1/unitperiode");
                }
                setUnits(unitsResponse.data.data.unit);
            } catch (err) {
                console.log(err);
            }
        };

        fetchUnits();
    }, [type]);

    const validateForm = () => {
        let formErrors = {};
        if (!nameComp) formErrors.nameComp = "Ce champ est obligatoire";
        if (!reference) formErrors.reference = "Ce champ est obligatoire";
        if (!type) formErrors.type = "Ce champ est obligatoire";
        if (!cycle) formErrors.cycle = "Ce champ est obligatoire";
        if (!unit_id) formErrors.unit_id = "Ce champ est obligatoire";

        if (type === 'Produit') {
            if (!currentValue) formErrors.currentValue = "Ce champ est obligatoire";
            if (parseFloat(currentValue) <= parseFloat(lastMaintValue)) {
                formErrors.currentValue = "La valeur actuelle doit être supérieure à la dernière valeur de maintenance";
            }
        }

        // Check if last maintenance date is required and touched when type is 'Periode'
        if (type === 'Periode' && !lastMaintDate && lastMaintDateTouched) {
            formErrors.lastMaintDate = "Ce champ est obligatoire";
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        try {
            const formData = new FormData();
            formData.append('id_equip', equipement.id);
            formData.append('name_equip', equipement.name);
            formData.append('name_comp', nameComp);
            formData.append('reference', reference);
            formData.append('type', type);
            formData.append('cycle', cycle);
            formData.append('unit_id', unit_id);
            formData.append('current_value', type === 'Periode' ? 0 : currentValue);
            formData.append('last_maint_value', type === 'Periode' ? 0 : lastMaintValue);
            formData.append('last_maint_date', lastMaintDate);
            formData.append('next_maint_date', nextMaintDate);
            formData.append('description', description);
            if (fichier) formData.append('file', fichier);

            const response = await axios.post("http://localhost:3001/api/v1/composant", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log(response.data);
            navigate("/equipment");
        } catch (err) {
            console.error(err);
        }
    };

    const handleDocumentChange = (e) => {
        setFichier(e.target.files[0]);
    };

    const clearForm = () => {
        setNameComp("");
        setReference("");
        setType("");
        setCycle("");
        setUnit_id("");
        setCurrentValue("");
        setLastMaintValue("");
        setLastMaintDate(getCurrentDateTimePlusOneHour());
        setNextMaintDate("");
        setDescription("");
        setFichier(null);
        setErrors({});
    };

    const handleCancel = () => {
        clearForm();
    };

    const handleCurrentValueChange = (e) => {
        const value = parseFloat(e.target.value);
        setCurrentValue(value);
    };

    const handleLastMaintValueChange = (e) => {
        const value = parseFloat(e.target.value);
        setLastMaintValue(value);
        if (value < 0) {
            setErrors(prevErrors => ({ ...prevErrors, lastMaintValue: "La valeur de la dernière maintenance ne peut pas être négative" }));
        } else {
            setErrors(prevErrors => {
                const { lastMaintValue, ...rest } = prevErrors;
                return rest;
            });
        }
    };

    const handleLastMaintDateChange = (e) => {
        setLastMaintDateTouched(true);
        setLastMaintDate(e.target.value);
    };

    return (
    <div className="content-wrapper">
    <section className="content">
        {equipement && (
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title">
                        <Link to="/equipment">Equipement</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                        <Link to="#">Ajouté composant</Link>
                        <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                        {name}
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
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group row mb-4">
                                    <label htmlFor="nameEquip" className="col-sm-3 col-form-label">Nom de l'équipement</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nameEquip"
                                            value={equipement.name}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="form-group row mb-4">
                                    <label htmlFor="nameComp" className="col-sm-3 col-form-label">Nom du Composant</label>
                                    <div className="col-sm-7">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nameComp"
                                            value={nameComp}
                                            onChange={(e) => setNameComp(e.target.value)}
                                        />
                                        {errors.nameComp && <span className="text-danger">{errors.nameComp}</span>}
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
                                        {errors.reference && <span className="text-danger">{errors.reference}</span>}
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
                                            <option value="">Sélectionnez un type</option>
                                            <option value="Produit">Produit</option>
                                            <option value="Periode">Periode</option>
                                        </select>
                                        {errors.type && <span className="text-danger">{errors.type}</span>}
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
                                        {errors.cycle && <span className="text-danger">{errors.cycle}</span>}
                                    </div>
                                </div>
                                <div className="form-group row mb-4">
                                    <label htmlFor="unit_id" className="col-sm-3 col-form-label">Unité</label>
                                    <div className="col-sm-7">
                                        <select
                                            className="form-control"
                                            id="unit_id"
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
                                        {errors.unit && <span className="text-danger">{errors.unit}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Tabs>
                            <TabList>
                                <Tab>Maintenance</Tab>
                                <Tab>Note</Tab>
                                <Tab>Instructions</Tab>
                            </TabList>
                            <TabPanel>
                                <div className="row">
                                    <div className="col-md-6">
                                        {type === "Produit" && (
                                            <>
                                                <div className="form-group row mb-4">
                                                    <label htmlFor="currentValue" className="col-sm-3 col-form-label">Valeur Actuelle</label>
                                                    <div className="col-sm-7">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id="currentValue"
                                                            value={currentValue}
                                                            onChange={handleCurrentValueChange}
                                                        />
                                                        {errors.currentValue && <span className="text-danger">{errors.currentValue}</span>}
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
                                                            onChange={handleLastMaintValueChange}
                                                        />
                                                        {errors.lastMaintValue && <span className="text-danger">{errors.lastMaintValue}</span>}
                                                    </div>
                                                </div>
                                                <div className="form-group row mb-4">
                                                    <label htmlFor="lastMaintDate" className="col-sm-3 col-form-label">Date de Dernière Maintenance</label>
                                                    <div className="col-sm-7">
                                                        <input
                                                            type="datetime-local"
                                                            className="form-control"
                                                            id="lastMaintDate"
                                                            value={lastMaintDate}
                                                            onChange={handleLastMaintDateChange}
                                                        />
                                                        {errors.lastMaintDate && <span className="text-danger">{errors.lastMaintDate}</span>}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {type === "Periode" && (
                                            <div className="form-group row mb-4">
                                                <label htmlFor="lastMaintDate" className="col-sm-3 col-form-label">Date de Dernière Maintenance</label>
                                                <div className="col-sm-7">
                                                    <input
                                                        type="datetime-local"
                                                        className="form-control"
                                                        id="lastMaintDate"
                                                        value={lastMaintDate}
                                                        onChange={handleLastMaintDateChange}
                                                      
                                                            onBlur={() => setLastMaintDateTouched(true)} // Set last maintenance date as touched when blurred
                                                            />
                                                            {errors.lastMaintDate && <span className="text-danger">{errors.lastMaintDate}</span>}
                                                        </div>
                                                    </div>
                                                )}
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
                                </Tabs>
                                <div className="ml-auto"> {/* Utilisation de ml-auto pour centrer les boutons à droite */}
                                    <button type="submit" className="btn btn-primary mr-2">
                                        Ajouter
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Addcomposant2;
