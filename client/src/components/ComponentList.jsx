import React, { useEffect, useState, useContext } from "react";
import ComponentFinder from '../apis/ComponentFinder';
import { useNavigate } from 'react-router-dom';
import { ComponentsContext } from '../context/ComponentsContext'; 
import axios from 'axios';
const ComponentList = () => {
    const { components, setComponents } = useContext(ComponentsContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [hoveredComponent, setHoveredComponent] = useState(null);
    const [propFunctionInfo, setPropFunctionInfo] = useState(null); // State to store prop function info
  
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ComponentFinder.get("/");
                setComponents(response.data.data.components);
                setSearchResults(response.data.data.components);
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [setComponents]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleUpdate = (e, id) => {
        e.stopPropagation();
        navigate(`/components/${id}/update`);
    };

    const handleDelete = async (id) => {
        try {
              // Confirmation message for deleting a single sector
    const confirmMessage = "Êtes-vous sûr de vouloir supprimer ce component ?";

    // Display a confirmation dialog before deleting the item
    const confirmDelete = window.confirm(confirmMessage);
    if (!confirmDelete) return; // If the user clicks cancel, exit the function

            await ComponentFinder.delete(`/${id}`);
            setComponents(components.filter((component) => component.id !== id));
            setSearchResults(searchResults.filter((component) => component.id !== id));
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
            components.filter(
                (component) =>
                component.name.toLowerCase().includes(term.toLowerCase()) ||
                component.ref.toLowerCase().includes(term.toLowerCase())
            )
        );
    };

    const handleMouseOver = async (name) => {
        try {
          const response = await axios.get(`http://localhost:3001/api/v1/component/${name}/prop_function`);
          // Check if data is available
          if (response.data.status === 'success' && response.data.data.prop_function.length > 0) {
            // Set the prop function info from the first element of the array
            setPropFunctionInfo(response.data.data.prop_function[0]);
          } else {
            // If no prop function data is available, set to null or handle accordingly
            setPropFunctionInfo(null);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      
      const handleMouseLeave = () => {
        setPropFunctionInfo(null); // Clear prop function info on mouse leave
      };

        
  const handleRead = (e, name) => {
    e.stopPropagation();
    navigate(`ReadComponent/${name}`);
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
                                <th>Nom des composants</th>
<th>Référence</th>
<th>Description</th>
<th>Date de maintenancce obligatoire</th>
<th>Équipement</th>
<th>Modifier</th>
<th>Supprimer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map(component => (
                                    <tr key={component.id}>
                                          {/* Tooltip or card */}
                {propFunctionInfo && (
                <div className="equipement-tooltip">
                <p><strong>Nom:</strong> {propFunctionInfo.name}</p>
                <p><strong>Type:</strong> {propFunctionInfo.type}</p>
                <p><strong>Unité:</strong> {propFunctionInfo.unit}</p>
              </div>
                )}
                 <td>
                    <div
                        onMouseOver={() => handleMouseOver(component.name)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {component.name}
                    </div>
                    </td>

                                        <td>{component.ref}</td>
                                        <td>{component.description}</td>
                                        <td>{component.breakdown_date && formatDate(component.breakdown_date)}</td>

                                        <td>{component.equipement_name}</td>
                                        <td>
    <button onClick={(e) => handleUpdate(e, component.id)} className="btn btn-warning">
        <i className="fas fa-pencil-alt"></i> {/* Icone de stylo */}
    </button>
</td>
<td>
    <button onClick={() => handleDelete(component.id)} className="btn btn-danger">
        <i className="fas fa-trash"></i> {/* Icone de poubelle */}
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

export default ComponentList;
