import React, { useState, useContext, useEffect } from "react";

import axios from 'axios';

const Addnomlogo = ({ hideAddEquipement }) => {
    const [refresh, setRefresh] = useState(false);
    const [name, setName] = useState("");
   
    const [image, setImage] = useState(null);
   
    const [errors, setErrors] = useState({
        name: "",
      
    });
    useEffect(() => {
        if (refresh) {
            window.location.reload();
            setRefresh(false);
        }
    }, [refresh]);
    


    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
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
       
    
     

        // If no errors, proceed with form submission
        try {
            const formData = new FormData();
            formData.append("name", name);
           
            formData.append("image", image);
           

            const response = await axios.post("/backend/api/v1/nomlogo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            clearForm();
            setRefresh(true); 
            window.location.reload();
            hideAddEquipement();
        } catch (err) {
            console.log(err);
        }
    };

    const clearForm = () => {
        setName("");
        
        setImage(null);
        
        setErrors({
            name: ""
           
        });
    };

    const handleCancel = () => {
        clearForm();
        hideAddEquipement();
    };

    return (
        <div className="content-wrapper">
            <div className="card">
                <div className="card-body">
                    <button onClick={hideAddEquipement} className="close-button">
                        <i className="fas fa-times"></i>
                    </button>
                    <form onSubmit={handleSubmit}>
                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <label htmlFor="name">Nom</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.name && 'is-invalid'}`}
                                    placeholder="Exemple: Fraiseuses"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <div className="invalid-feedback">{errors.name}</div>
                            </div>
                           
                            
                            <div className="form-group col-md-4">
                                <label htmlFor="image">Image</label>
                                <input
                                    type="file"
                                    className="form-control-file"
                                    onChange={handleImageChange}
                                    accept=".jpg, .png"
                                />
                            </div>
                           
</div>
                        <button type="submit" className="btn btn-primary mr-2">Ajouter</button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel}>Annuler</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Addnomlogo;
