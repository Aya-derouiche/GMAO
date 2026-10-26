import React, { useState, useContext } from "react";
import SecteurFinder from '../apis/SecteurFinder';
import { SecteursContext } from '../context/SecteursContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

const AddSecteur = ({ hideAddSecteur }) => {
    const { addSecteur } = useContext(SecteursContext);
    const [ref, setRef] = useState("");
    const [lib, setLib] = useState("");
    const [description, setDescription] = useState("");
    const [refError, setRefError] = useState("");
    const [libError, setLibError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset errors
        setRefError("");
        setLibError("");

        // Validate fields
        if (!ref) {
            setRefError("La référence est obligatoire.");
            return;
        }
        if (!lib) {
            setLibError("Le libellé est obligatoire.");
            return;
        }

        try {
            const response = await SecteurFinder.post("", {
                ref: ref,
                lib: lib,
                description: description,
            });
            if (!response.data?.data?.secteur) {
                const body = typeof response.data === "string"
                    ? response.data.slice(0, 200)
                    : JSON.stringify(response.data);
                throw new Error(`Réponse API inattendue : ${body || "corps vide"}`);
            }
            addSecteur(response.data.data.secteur);
            hideAddSecteur();
            clearForm();
            toast.success("Secteur ajouté avec succès!");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error(err);
            const status = err.response?.status
                ? ` (HTTP ${err.response.status})`
                : err.isAxiosError ? " (erreur réseau)" : " (réponse API)";
            const message = err.response?.data?.message || err.message;
            toast.error(`Ajout du secteur impossible${status} : ${message}`);
        }
    };
    
    const clearForm = () => {
        setRef("");
        setLib("");
        setDescription("");
        setRefError("");
        setLibError("");
    };

    const handleCancel = () => {
        clearForm();
    };
    
    return (
        <div className="card">
            <div className="card-body">
                <button onClick={hideAddSecteur} className="close-button">
                    <i className="fas fa-times"></i>
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="ref" style={{  color: '#000' }}>Reference</label>
                        <input
                            type="text"
                            className={`form-control ${refError ? 'is-invalid' : ''}`}
                            id="ref"
                            placeholder="Reference"
                            value={ref}
                            onChange={(e) => setRef(e.target.value)}
                        />
                        {refError && <div className="invalid-feedback">{refError}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="lib" style={{  color: '#000' }}>Libellé</label>
                        <input
                            type="text"
                            className={`form-control ${libError ? 'is-invalid' : ''}`}
                            id="lib"
                            placeholder="Libellé"
                            value={lib}
                            onChange={(e) => setLib(e.target.value)}
                        />
                        {libError && <div className="invalid-feedback">{libError}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="description" style={{  color: '#000' }}>Description</label>
                        <input
                            type="text"
                            className="form-control"
                            id="description"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Ajouter</button> &nbsp;&nbsp;
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>Annuler</button>         
                </form>
            </div>
        </div>
    );
};

export default AddSecteur;
