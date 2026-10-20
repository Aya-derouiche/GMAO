import React, { useEffect, useState, useContext } from "react";
import InterventionFinder from '../apis/InterventionFinder';
import { useNavigate } from 'react-router-dom';
import { InterventionsContext } from '../context/InterventionsContext';

const InterventionList = () => {
  const { interventions, setInterventions } = useContext(InterventionsContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
     
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await InterventionFinder.get("/");
        setInterventions(response.data.data.interventions);
        setSearchResults(response.data.data.interventions);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setInterventions]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/interventions/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await InterventionFinder.delete(`/${id}`);
      setInterventions(interventions.filter((intervention) => intervention.id !== id));
      setSearchResults(searchResults.filter((intervention) => intervention.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDate2 = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterResults(e.target.value);
  };

  const filterResults = (term) => {
    setSearchResults(
      interventions.filter(
        (intervention) =>
          intervention.description.toLowerCase().includes(term.toLowerCase()) ||
          intervention.description.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <div className="content-wrapper">
    <div className="content-header">
      <div className="container-fluid">
        <div className="row mb-2">
          <div className="col-sm-6">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Search by name or location"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
    </div>
    <div className="row">
      <div className="col">
        <div className="table-responsive">
          <table className="table equipement-table">
            <thead>
              <tr className="bg-info">
              <th>Réf</th>
<th>Numéro de demande</th>
<th>Date de demande</th>
<th>Numéro d'heure</th>
<th>Type</th>
<th>Coût</th>
<th>Date estimée de début d'intervention</th>
<th>Description</th>
<th>Rapport</th>
<th>Équipement</th>
<th>Réclamation</th>
<th>Composant</th>
<th>Technicien</th>
<th>Modifier</th>
<th>Supprimer</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map(intervention => (
            <tr key={intervention.id}>
              <td>{intervention.ref}</td>
              <td>{intervention.request_num}</td>
              <td>{formatDate2(intervention.request_date)}</td>
              <td>{intervention.hour_nbr}</td>
              <td>{intervention.type_inter}</td>
              <td>{intervention.cost_inter}</td>
              <td>{formatDate(intervention.begin_date_hour)}</td>
              <td>{intervention.description}</td>
              <td>{intervention.report}</td>
              <td>{intervention.equipement_name}</td>
              <td>{intervention.reclamation_ref}</td>
              <td>{intervention.component_name}</td>
              <td>{intervention.technicien_name}</td>
              <td>
                <button onClick={(e) => handleUpdate(e, intervention.id)} className="btn btn-warning">
                <i className="fas fa-pencil-alt"></i>
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(intervention.id)} className="btn btn-danger">
                <i className="fas fa-trash"></i>
                </button>
              </td>
              </tr>
                ))}
              </tbody>
            </table> 
          </div>
        </div>
      </div>
    </div>
  );
};
export default InterventionList;
