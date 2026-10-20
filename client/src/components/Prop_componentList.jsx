import React, { useEffect, useState, useContext } from "react";
import Prop_componentFinder from '../apis/Prop_componentFinder';
import { useNavigate } from 'react-router-dom';
import { Prop_componentsContext } from '../context/Prop_componentsContext';

const Prop_componentList = () => {
  const { prop_components, setProp_components } = useContext(Prop_componentsContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Prop_componentFinder.get("/");
        setProp_components(response.data.data.prop_component);
        setSearchResults(response.data.data.prop_component);
      } catch (err) {
        console.error(err);
      } 
    };

    fetchData();
  }, [setProp_components]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/prop_components/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await Prop_componentFinder.delete(`/${id}`);
      setProp_components(prop_components.filter((prop_component) => prop_component.id !== id));
      setSearchResults(searchResults.filter((prop_component) => prop_component.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterResults(e.target.value);
  };

  const filterResults = (term) => {
    setSearchResults(
      prop_components.filter(
        (prop_component) =>
          prop_component.description.toLowerCase().includes(term.toLowerCase()) ||
          prop_component.description.toLowerCase().includes(term.toLowerCase())
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
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table equipement-table">
              <thead>
                <tr className="bg-info">
                <th>Valeur actuelle</th>
<th>Cycle</th>
<th>Dernière valeur de maintenance</th>
<th>Date de dernière maintenance</th>
<th>Description</th>
<th>Composant</th>
<th>Propriété de fonction</th>
<th>Modifier</th>
<th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(prop_component => (
                  <tr key={prop_component.id}>
                    <td>{prop_component.current_value}</td>
                    <td>{prop_component.cycle}</td>
                    <td>{prop_component.last_maint_value}</td>
                    <td>{formatDate(prop_component.last_maint_date)}</td>
                    <td>{prop_component.description}</td>
                    <td>{prop_component.component_name}</td>
                    <td>{prop_component.prop_function_name}</td>
                    <td>
                      <button onClick={(e) => handleUpdate(e, prop_component.id)} className="btn btn-warning">
                      <i className="fas fa-pencil-alt"></i>
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(prop_component.id)} className="btn btn-danger">
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

export default Prop_componentList;
