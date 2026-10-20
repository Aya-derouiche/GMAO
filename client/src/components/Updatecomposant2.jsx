import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

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

function Updatecomposant2() {
    const [id_equip, setIdequip] = useState("");
    const [name_equip, setNameEquip] = useState("");
    const [nameComp, setNameComp] = useState("");
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

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const composantResponse = await axios.get(`/backend/api/v1/composant/${id}`);
                const composantData = composantResponse.data.data.composant;
                setIdequip(composantData.id_equip);
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
        const fetchUnits = async () => {
            try {
                let unitsResponse;
                if (type === 'Produit') {
                    unitsResponse = await axios.get("/backend/api/v1/unitproduit");
                } else if (type === 'Periode') {
                    unitsResponse = await axios.get("/backend/api/v1/unitperiode");
                }
                setUnits(unitsResponse.data.data.unit);
            } catch (err) {
                console.log(err);
            }
        };

        fetchUnits();
    }, [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Assumed that equipement data is available
            const formData = new FormData();
            formData.append('id_equip', id_equip);
            formData.append('name_equip', name_equip);
            formData.append('name_comp', nameComp);
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
            navigate("/composant");
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
        setType("Produit");
        setCycle("");
        setUnit_id("");
        setCurrentValue("");
        setLastMaintValue("");
        setLastMaintDate(getCurrentDateTimePlusOneHour());
        setNextMaintDate("");
        setDescription("");
        setFichier(null);
    };

    const handleCancel = () => {
        clearForm();
    };

    const handleDelete = async () => {
        try {
            const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce composant?");
            if (!confirmDelete) return;

            await axios.delete(`/backend/api/v1/composant/${id}`);
            navigate("/equipment");
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title">
                            <Link to="/equipment">Equipement</Link>
                            <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                            <Link to="#">Detail du composant</Link>
                            <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                            {nameComp}
                        </h5>
                        <div className="card-tools">
                            <button onClick={handleDelete} className="btn btn-outline-danger">
                                <i className="fas fa-trash"></i>
                            </button>
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
                                        <label htmlFor="nameComp" className="col-sm-3 col-form-label">Nom du Composant</label>
                                        <div className="col-sm-7">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="nameComp"
                                                value={nameComp}
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
                            </Tabs>
                            <div className="ml-auto">
                                <button type="submit" className="btn btn-primary mr-2">
                                    Enregistrer
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Updatecomposant2;
