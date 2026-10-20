import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Updatemdp = () => {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [job_title, setJob_title] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Récupération des données de l'utilisateur lors du montage du composant
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Récupération des données de l'utilisateur depuis le serveur en utilisant l'identifiant de l'utilisateur
      const response = await axios.get(`http://localhost:3001/api/v1/users/${id}`);
      const userData = response.data.data.users;
      const response2 = await axios.get(`http://localhost:3001/api/v1/employee/${id}`);
      const employeeData = response2.data.data.employee;
      setUserId(userData.userid);
      setPassword(userData.password);
      setPhone(employeeData.phone);
      setJob_title(employeeData.job_title);
      setEmail(employeeData.email);
    } catch (error) {
      console.error("Erreur lors de la récupération des données de l'utilisateur :", error);
      alert("Échec de la récupération des données de l'utilisateur. Veuillez réessayer.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Vérification des champs obligatoires
    if (!userId.trim() || !password.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
  
    try {
      const response = await axios.put(
        `http://localhost:3001/api/v1/users/${id}`,
        {
          userid: userId,
          password: password,
          phone: phone,
          job_title: job_title,
          email: email
        }
      );
      if (response.data.status === "success") {
        handleLogout();
      } else {
        alert("Échec de la mise à jour des informations de l'utilisateur.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe :", error);
      alert("Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.");
    }
  };
  
  const handleLogout = () => {
    axios
      .get("http://localhost:3001/api/v1/logout")
      .then((res) => {
        if (res.data.status === "Success") {
          navigate("/");
        } else {
          alert("vos modification a été effectuée avec succès.");
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Erreur de déconnexion :", err);
        alert("Échec de la déconnexion. Veuillez réessayer.");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div
        className="card p-4 rounded w-50"
        style={{
          maxWidth: "400px",
          backgroundColor: "#f8f9fa",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
        }}
      >
        <h2 className="text-center mb-4">Modifiez votre profile </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nom d'utilisateur</label>
            <input
              type="text"
              name="userid"
              autoComplete="off"
              placeholder="Nom d'utilisateur"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="form-control rounded-0"
              disabled
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              name="password"
              autoComplete="off"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control rounded-0"
            /> 
          </div>
          <div className="mb-3">
            <label className="form-label">Téléphone</label>
            <input
              type="text"
              name="phone"
              autoComplete="off"
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-control rounded-0"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Adresse</label>
            <input
              type="text"
              name="job_title"
              autoComplete="off"
              placeholder="Adresse"
              value={job_title}
              onChange={(e) => setJob_title(e.target.value)}
              className="form-control rounded-0"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="off"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control rounded-0"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block rounded-0"
            style={{ backgroundColor: "#007bff", borderColor: "#875A7B" }}
          >
            Soumettre
          </button>
        </form>
      </div>
    </div>
  );
};

export default Updatemdp;
