import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { Component_intersContext } from '../context/Component_intersContext';
import Component_interFinder from '../apis/Component_interFinder';

const ComponentInterList = () => {
  const { component_inters, setComponent_inters } = useContext(Component_intersContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
    
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Component_interFinder.get("/");
        setComponent_inters(response.data.data.component_inter);
        setSearchResults(response.data.data.component_inter);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setComponent_inters]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/component_inters/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await Component_interFinder.delete(`/${id}`);
      setComponent_inters(component_inters.filter((component_inter) => component_inter.id !== id));
      setSearchResults(searchResults.filter((component_inter) => component_inter.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterResults(e.target.value);
  };

  const filterResults = (term) => {
    setSearchResults(
        component_inters.filter(
        (component_inter) =>
        component_inter.technicien_name.toLowerCase().includes(term.toLowerCase()) ||
        component_inter.intervention_name.toLowerCase().includes(term.toLowerCase())
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
         
<th>Changement de réparation</th>
            <th>Dernières valeurs</th>
            <th>Identifiant du composant</th>
            <th>Intervention</th>
            <th>Modifier</th>
            <th>Supprimer</th>
          </tr>
        </thead>
        <tbody>
        {searchResults.map(component_inter => (
            <tr key={component_inter.id}>
              <td>{component_inter.repair_change}</td>
              <td>{component_inter.last_values}</td>
              <td>{component_inter.component_name}</td>
              <td>{component_inter.intervention_name}</td>
              <td>
                <button onClick={(e) => handleUpdate(e, component_inter.id)} className="btn btn-warning">
                <i className="fas fa-pencil-alt"></i>
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(component_inter.id)} className="btn btn-danger">
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

export default ComponentInterList;
