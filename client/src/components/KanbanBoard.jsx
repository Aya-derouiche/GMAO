import React, { useEffect, useState, useContext } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { useNavigate } from 'react-router-dom';
import { ReclamationsContext } from '../context/ReclamationsContext'; 
import axios from 'axios';

function KanbanBoard() {
    const { reclamations, setReclamations } = useContext(ReclamationsContext);    
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTechnician, setIsTechnician] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ReclamationFinder.get("/");
                setReclamations(response.data.data.reclamations);
                setSearchResults(response.data.data.reclamations);
            } catch (err) {
                console.error(err);
            }
        };
 
        fetchData();
    }, [setReclamations]);

    useEffect(() => {
      // Vérifier si l'utilisateur est administrateur
      const checkAdmin = async () => {
        try {
          const response = await axios.get('http://localhost:3001', { withCredentials: true });
          setIsAdmin(response.data.role === 'admin');
          setIsTechnician(response.data.role === 'technician');
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error);
        }
      };
      checkAdmin();
    }, []);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
          case 'Urgente':
            return { backgroundColor: '#E74C3C', color: '#ffffff' };
          case 'Élevée':
            return { backgroundColor: '#e2684e', color: '#ffffff' };
          case 'Moyenne':
            return { backgroundColor: '#FFC300', color: '#ffffff' };
          case 'Basse':
            return { backgroundColor: '#3498DB', color: '#ffffff' };
          default:
            return {};
        }
    };

    const getStateColor = (state) => {
        switch (state) {
          case 'En attente...':
            return { backgroundColor: '#dddddd', color: '#000000' }; // gris
          case 'En cours':
            return { backgroundColor: '#add8e6', color: '#000000' }; // bleu clair
          case 'Terminée':
            return { backgroundColor: '#83c083', color: '#000000' }; // vert
          default:
            return {};
        }
    };

    const renderReclamations = (reclamations) => {
      return reclamations.map(reclamation => (
          <div key={reclamation.id} className="card card-primary card-outline">
              <div className="card-header">
                  <h5 className="card-title">{reclamation.equipement_name}</h5>
                  <div className="card-tools">
                      <span style={{ ...getPriorityColor(reclamation.priority) }}>{reclamation.priority}</span>
                      <span style={{ ...getStateColor(reclamation.state) }}>{reclamation.state}</span>
                  </div>
              </div>
              <div className="card-body">
                  <p>Created by: {reclamation.created_by}</p>
                  <p>Responsible: {reclamation.responsible_name}</p>
                  <p>Creation Date: {formatDate(reclamation.creation_date)}</p>
              </div>
          </div>
      ));
  };

  const renderReclamations2 = (reclamations) => {
    return reclamations.map(reclamation => (
        <div key={reclamation.id} className="card card-primary card-outline">
            <div className="card-header">
                <h5 className="card-title">{reclamation.equipement_name}</h5>
                <div className="card-tools">
                    <span style={{ ...getPriorityColor(reclamation.priority) }}>{reclamation.priority}</span>
                    <span style={{ ...getStateColor(reclamation.state) }}>{reclamation.state}</span>
                    {/* Vérification de l'affectation */}
                   
                </div>
            </div>
            <div className="card-body">
                <p>Créé par : {reclamation.created_by}</p>
                <p>Responsable : {reclamation.responsible_name}</p>
                <p>Date de création : {formatDate(reclamation.creation_date)}</p>
               
                 {reclamation.state === 'En attente...' && !reclamation.affecter && (isAdmin || isTechnician) && (
                    <a href={`http://localhost:5173/reclamation/Readreclamation/${reclamation.ref}`}>
                        <button className="btn btn-primary">Affecter</button>
                    </a>
                )}
                <span>{reclamation.affecter ? 'Affectée' : 'Non Affectée'}</span>
            </div>
        </div>
    ));
  };

  const todoReclamations = searchResults.filter(reclamation => reclamation.state === 'En attente...');
  const inProgressReclamations = searchResults.filter(reclamation => reclamation.state === 'En cours');
  const doneReclamations = searchResults.filter(reclamation => reclamation.state === 'Terminée');

  return (
      <div className="content-wrapper kanban">
          <section className="content-header">
              <div className="container-fluid">
                  <div className="row">
                      <div className="col-sm-6">
                          <h1>Tableau kanban</h1>
                      </div>
                      <div className="col-sm-6 d-none d-sm-block">
                          <ol className="breadcrumb float-sm-right">
                              <li className="breadcrumb-item"><a href="#">Accueil</a></li>
                              <li className="breadcrumb-item active">tableau kanban</li>
                          </ol>
                      </div>
                  </div>
              </div>
          </section>

          <section className="content pb-3">
              <div className="container-fluid h-100">
                  <div className="card card-row card-secondary">
                      <div className="card-header">
                          <h3 className="card-title">En Attente...</h3>
                      </div>
                      <div className="card-body">
                          {renderReclamations2(todoReclamations)}
                      </div>
                  </div>
                  <div className="card card-row card-default">
                      <div className="card-header bg-info">
                          <h3 className="card-title">En Cours</h3>
                      </div>
                      <div className="card-body">
                          {renderReclamations(inProgressReclamations)}
                      </div>
                  </div>
                  <div className="card card-row card-success">
                      <div className="card-header">
                          <h3 className="card-title">Terminée</h3>
                      </div>
                      <div className="card-body">
                          {renderReclamations(doneReclamations)}
                      </div>
                  </div>
              </div>
          </section>
      </div>
  );
}

export default KanbanBoard;
