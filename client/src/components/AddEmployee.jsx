import React, { useState, useContext, useEffect } from "react";
import EmployeeFinder from '../apis/EmployeeFinder';
import { EmployeesContext } from '../context/EmployeesContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const AddEmployee = ({ hideAddEmployee }) => {
    const { addEmployees } = useContext(EmployeesContext);
    const [employee, setEmployee] = useState({
        firstname: "",
        userid: "", // Remove userid field from state
        post: "",
        documents: "",
        job_title: "",
        phone: "",
        email: "",
        cin: "", // New field: CIN
        password: "", // Remove password field from state
        role: "" // New field: Role
    });
    const [errors, setErrors] = useState({
        firstname: "",
        post: "",
        phone: "",
        cin: "",
        role: "" 
    });
    const [refresh, setRefresh] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'firstname') {
            setEmployee({
                ...employee,
                [name]: value,
                userid: value.toLowerCase().replace(/\s/g, '') // Generate userid based on firstname
            });
        } else if (name === 'cin') {
            setEmployee({
                ...employee,
                [name]: value,
                password: employee.firstname.toLowerCase().replace(/\s/g, '') + value // Generate password based on firstname and cin
            });
        } else {
            setEmployee({ ...employee, [name]: value });
        }
    };

    useEffect(() => {
        if (refresh) {
            window.location.reload();
            setRefresh(false);
        }
    }, [refresh]);

    const handleDocumentChange = (e) => {
        setEmployee({ ...employee, documents: e.target.files[0] });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!employee.firstname.trim()) {
            errors.firstname = "Nom est obligatoire";
        } else if (employee.firstname.trim().length < 4) {
            errors.firstname = "Le nom doit comporter au moins 4 caractères";
        } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(employee.firstname.trim())) {
            errors.firstname = "Le nom ne doit contenir que des lettres et des espaces";
        }
        
        if (!employee.post.trim()) {
            errors.post = "Poste est obligatoire";
        }
        if (!employee.cin.trim()) {
            errors.cin = "CIN est obligatoire";
        } else if (isNaN(employee.cin.trim())) {
            errors.cin = "Doit être un nombre";

        } else if (employee.cin.trim().length !== 8) {
            errors.cin = "Doit être composé de 8 chiffres";
        }

        if (!employee.phone.trim()) {
            errors.phone = "Phone est obligatoire";

        }else if (employee.phone.trim().length !== 8) {
            errors.phone = "Doit être composé de 8 chiffres";
        }

        if (!employee.role.trim()) {
            errors.role = "Role est obligatoire";
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        try {
            const response = await axios.get(`/backend/api/v1/checkCinUniqueness_add?cin=${employee.cin}`);
            // If serial number exists, handle it
            if (response.data.error) {
                errors.cin = response.data.error;
                setErrors(errors);
                return; // Stop form submission if serial number already exists
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 400) {
                errors.cin = "Ce numéro de série existe déjà";
                setErrors(errors);
            }
            return;
        }

        try {
            const formData = new FormData();
            formData.append("firstname", employee.firstname);
            formData.append("userid", employee.userid);
            formData.append("post", employee.post);
            formData.append("file", employee.documents);
            formData.append("job_title", employee.job_title);
            formData.append("phone", employee.phone);
            formData.append("email", employee.email);
            formData.append("cin", employee.cin); // Append CIN
            formData.append("password", employee.password); // Append Password
            formData.append("role", employee.role); // Append Role
    
            const response = await EmployeeFinder.post("/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log(response.data.data);
            addEmployees(response.data.data.employee);
            clearForm();
            setRefresh(true);
            window.location.reload();
            hideAddEmployee();
        } catch (err) {
            console.log(err);
        }
    };
    
    const clearForm = () => {
        setEmployee({
            firstname: "",
            userid: "",
            post: "",
            documents: "",
            job_title: "",
            phone: "",
            email: "",
            cin: "", // Clear CIN field
            password: "", // Clear Password field
            role: "" // Clear Role field
        });
        setErrors({
            firstname: "",
            post: "",
            phone: "",
            cin: "", // Clear CIN field
            role: "" 
        });
  
    };
    
    const handleCancel = () => {
        clearForm();
        hideAddEquipement();
    };
    return (
        <div className="content-wrapper">
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            
           
        
            <div className="card">
           
                <div className="card-body">
                <button onClick={hideAddEmployee} className="close-button">
                                <i className="fas fa-times"></i>
                            </button>
                  
                    <form onSubmit={handleSubmit}>
    <div className="form-row">
        <div className="form-group col-md-4">
            <label htmlFor="firstname"style={{color: 'black'}} >Nom et Prénom</label>
            <input
                type="text"
                className={`form-control ${errors.firstname && 'is-invalid'}`}
                placeholder="Prénom"
                name="firstname"
                value={employee.firstname}
                onChange={handleChange}
            />
            <div className="invalid-feedback">{errors.firstname}</div>
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="post"style={{color: 'black'}}>Poste</label>
            <input
                type="text"
                className={`form-control ${errors.post && 'is-invalid'}`}
                placeholder="Poste"
                name="post"
                value={employee.post}
                onChange={handleChange}
            />
            <div className="invalid-feedback">{errors.post}</div>
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="documents"style={{color: 'black'}}>Documents</label>
            <input
                type="file"
                className="form-control-file" style={{color: 'black'}}
                onChange={handleDocumentChange}
                accept=".pdf,.doc,.docx" // Accepter des formats de document spécifiques
            />
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="job_title"style={{color: 'black'}}>Adresse</label>
            <input
                type="text"
                className="form-control"
                placeholder="Adresse"
                name="job_title"
                value={employee.job_title}
                onChange={handleChange}
            />
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="phone"style={{color: 'black'}}>Téléphone</label>
            <input
                type="text"
                className={`form-control ${errors.phone && 'is-invalid'}`}
                placeholder="Téléphone"
                name="phone"
                value={employee.phone}
                onChange={handleChange}
            />
            <div className="invalid-feedback">{errors.phone}</div>
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="email"style={{color: 'black'}}>Email</label>
            <input
                type="email"
                className="form-control"
                placeholder="Email"
                name="email"
                value={employee.email}
                onChange={handleChange}
            />
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="cin"style={{color: 'black'}}>CIN</label>
            <input
                type="text"
                className={`form-control ${errors.cin && 'is-invalid'}`}
                placeholder="CIN"
                name="cin"
                value={employee.cin}
                onChange={handleChange}
            />
            {errors.cin && <div className="invalid-feedback">{errors.cin}</div>} {/* Afficher le message d'erreur s'il existe */}
        </div>
        <div className="form-group col-md-4">
            <label htmlFor="role"style={{color: 'black'}}>Rôle</label>
            <select
                className={`form-control ${errors.role && 'is-invalid'}`}
                name="role"
                value={employee.role}
                onChange={handleChange}
            >
                <option value="">Sélectionner le rôle</option>
                <option value="admin">Administrateur</option>
                <option value="technician">Technicien</option>
                <option value="employee">Employé</option>
            </select>
            <div className="invalid-feedback">{errors.role}</div>
        </div>
    </div>
    <button type="submit" className="btn btn-primary">Ajouter l'employé</button>
    <button type="button" className="btn btn-secondary" onClick={handleCancel}>Annuler</button>
</form>

                </div>
            </div>
            </div>
    );
};

export default AddEmployee;
