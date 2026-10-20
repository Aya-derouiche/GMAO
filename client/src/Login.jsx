import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function Login() {
    const [values, setValues] = useState({
        userid: '',
        password: ''
    });
    const navigate = useNavigate();
    axios.defaults.withCredentials=true;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/backend/api/v1/login", values);
            if (response.data.status === "success") {
                navigate('/dash');
                window.location.reload();
                if (response.data.isFirstLogin) {
                    alert("Il faut modifier votre mot de passe pour plus de sécurité.");
                }
            } else {
                alert(response.data.message);
            }
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            const message = status === 401
                ? "Nom d'utilisateur ou mot de passe incorrect"
                : err.response?.data?.message || "Le serveur ou la base de données est indisponible.";
            alert(message);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="card p-4 rounded w-50" style={{ maxWidth: '500px', backgroundColor: '#f8f9fa', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                <div className="card p-4 rounded" style={{ maxWidth: '450px', backgroundColor: '#ffffff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', margin: 'auto' }}>
                    <h2 className="text-center mb-4" style={{ color: '#333', fontWeight: '600' }}>Se connecter</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label" style={{ color: '#555', fontWeight: '500' }}>Nom d'utilisateur</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" style={{ borderRadius: '0', borderRight: '0', backgroundColor: '#e9ecef', borderColor: '#ddd' }}>
                                        <i className="fa fa-user" style={{ color: '#555' }}></i>
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    name="userid" 
                                    autoComplete="off"
                                    placeholder="Nom d'utilisateur"
                                    value={values.userid} 
                                    onChange={e => setValues({ ...values, userid: e.target.value })} 
                                    className="form-control" 
                                    style={{ borderRadius: '0', borderLeft: '0', borderColor: '#ddd', padding: '10px', fontSize: '16px' }} 
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label" style={{ color: '#555', fontWeight: '500' }}>Mot de passe</label>
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" style={{ borderRadius: '0', borderRight: '0', backgroundColor: '#e9ecef', borderColor: '#ddd' }}>
                                        <i className="fa fa-lock" style={{ color: '#555' }}></i>
                                    </span>
                                </div>
                                <input 
                                    type="password" 
                                    name="password" 
                                    autoComplete="off"
                                    placeholder="Mot de passe"
                                    value={values.password} 
                                    onChange={e => setValues({ ...values, password: e.target.value })} 
                                    className="form-control" 
                                    style={{ borderRadius: '0', borderLeft: '0', borderColor: '#ddd', padding: '10px', fontSize: '16px' }} 
                                />
                            </div>
                        </div>
                        <p className="text-muted text-center" style={{ fontSize: '14px' }}>Si vous rencontrez un problème, contactez votre administration</p>
                        <button type="submit" className="btn btn-primary btn-block rounded-3" style={{ backgroundColor: '#0069d9', borderColor: '#0069d9', padding: '10px 0', fontSize: '16px' }}>Se connecter</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
