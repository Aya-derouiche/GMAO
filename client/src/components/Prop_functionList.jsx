import React, { useEffect, useState, useContext } from "react";
import Prop_functionFinder from '../apis/Prop_functionFinder';
import { useNavigate ,  Link } from 'react-router-dom';
import { Prop_functionsContext } from '../context/Prop_functionsContext';

const Prop_functionList = () => {
  const { prop_functions, setProp_functions } = useContext(Prop_functionsContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Prop_functionFinder.get("/");
        setProp_functions(response.data.data.prop_function);
        setSearchResults(response.data.data.prop_function.reverse()); // Reverse the order here
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setProp_functions]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/prop_functions/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await Prop_functionFinder.delete(`/${id}`);
      setProp_functions(prop_functions.filter((prop_function) => prop_function.id !== id));
      setSearchResults(searchResults.filter((prop_function) => prop_function.id !== id));
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
      prop_functions.filter(
        (prop_function) =>
          prop_function.name.toLowerCase().includes(term.toLowerCase()) ||
          prop_function.unit.toLowerCase().includes(term.toLowerCase())
      ).reverse() // Reverse the order here
    );
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
            <h5 className="card-title">
                            <Link to="/equipment">Equipement</Link>
                            <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                         Liste des propriétés de fonctionnement
                        </h5><br></br><br></br>
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
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Unité</th>
                  <th>Identifiant du composant</th>
                  <th>Identifiant de l'équipement</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(prop_function => (
                  <tr key={prop_function.id}>
                    <td>{prop_function.name}</td>
                    <td>{prop_function.type}</td>
                    <td>{prop_function.unit}</td>
                    <td>{prop_function.component_name}</td>
                    <td>{prop_function.equipement_name}</td>
                    <td>
                      <button onClick={(e) => handleUpdate(e, prop_function.id)} className="btn btn-outline-warning">
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(prop_function.id)} className="btn btn-outline-danger">
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

export default Prop_functionList;
