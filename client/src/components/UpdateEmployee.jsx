import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { EmployeesContext } from "../context/EmployeesContext";
import EmployeeFinder from "../apis/EmployeeFinder";
import { useNavigate } from 'react-router-dom';

const UpdateEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employee } = useContext(EmployeesContext);
  const [firstname, setFirstname] = useState("");
  const [userid, setUserid] = useState("");
  const [post, setPost] = useState("");
  const [documents, setDocuments] = useState("");
  const [job_title, setJob_title] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cin, setCin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await EmployeeFinder.get(`/${id}`);
        const employeeData = response.data.data.employee;

        setFirstname(employeeData.firstname);
        setUserid(employeeData.userid);
        setPost(employeeData.post);
        setDocuments(employeeData.documents);
        setJob_title(employeeData.job_title);
        setPhone(employeeData.phone);
        setEmail(employeeData.email);
        setCin(employeeData.cin);
        setPassword(employeeData.firstname + employeeData.cin); // Set password based on firstname and cin
        setRole(employeeData.role);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleDocumentChange = (e) => {
    const newDocument = e.target.files[0];
    // Check if a new document is selected
    if (newDocument) {
      setDocuments(newDocument);
    } else {
      // No new document selected, retain the existing document data
      setDocuments(employee.documents);
    }

    // Automatically update password when CIN is changed
    setPassword(firstname + e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("firstname", firstname);
      formData.append("userid", userid);
      formData.append("post", post);
      formData.append("file", documents);
      formData.append("job_title", job_title);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("cin", cin);
      formData.append("password", password);
      formData.append("role", role);

      await EmployeeFinder.put(`/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate('/employee');
    } catch (err) {
      console.error(err);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="card">
          <div className="card-header">
            <button onClick={() => navigate('/employee')} className="btn btn-sm btn-danger float-right">Fermer</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="firstname">Prénom</label>
                    <input
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      id="firstname"
                      className="form-control"
                      type="text"
                      name="firstname"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userid">Identifiant utilisateur</label>
                    <input
                      value={userid}
                      onChange={(e) => setUserid(e.target.value)}
                      id="userid"
                      className="form-control"
                      type="text"
                      name="userid"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="post">Poste</label>
                    <input
                      value={post}
                      onChange={(e) => setPost(e.target.value)}
                      id="post"
                      className="form-control"
                      type="text"
                      name="post"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="documents">Documents</label>
                    <input
                      value={documents}
                      onChange={(e) => setDocuments(e.target.value)}
                      id="documents"
                      className="form-control"
                      type="text"
                      name="documents"
                      disabled
                    />
                    <div className="col">
                      <input
                        id="file"
                        type="file"
                        name="file"
                        className="form-control-file"
                        onChange={handleDocumentChange}
                        accept=".pdf,.doc,.docx" // Accept specific document formats
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="job_title">Adresse</label>
                    <input
                      value={job_title}
                      onChange={(e) => setJob_title(e.target.value)}
                      id="job_title"
                      className="form-control"
                      type="text"
                      name="job_title"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      id="phone"
                      className="form-control"
                      type="text"
                      name="phone"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      id="email"
                      className="form-control"
                      type="email"
                      name="email"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="cin">CIN</label>
                    <input
                      value={cin}
                      onChange={(e) => setCin(e.target.value)}
                      id="cin"
                      className="form-control"
                      type="text"
                      name="cin"
                    />
                  </div>
                  <div className="form-group">
  <label htmlFor="password">Mot de passe</label>
  <div className="input-group">
    <input
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      id="password"
      className="form-control"
      type={showPassword ? "text" : "password"}
      name="password"
    />
    <div className="input-group-append">
      <span className="input-group-text" onClick={togglePasswordVisibility}>
        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </span>
    </div>
  </div>
</div>

                  <div className="form-group">
                    <label htmlFor="role">Rôle</label>
                    <select
                      className="form-control"
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="">Sélectionner un rôle</option>
                      <option value="admin">Administrateur</option>
                      <option value="technician">Technicien</option>
                      <option value="employee">Employé</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Soumettre
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
  };
  
export default UpdateEmployee;
