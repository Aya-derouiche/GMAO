import React, { useEffect, useState, useContext } from "react";
import EquipementFinder from '../apis/EquipementFinder';
import { Link, useNavigate } from 'react-router-dom';
import { EquipementsContext } from '../context/EquipementsContext';
import axios from 'axios';
import './EquipementList.css';
import { mediaUrl } from '../utils/mediaUrl';

const EquipementList = () => {
  const { equipements, setEquipements } = useContext(EquipementsContext);
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTermReference, setSearchTermReference] = useState("");
  const [searchTermName, setSearchTermName] = useState("");
  const [searchTermModel, setSearchTermModel] = useState("");
  const [searchTermSerialNumber, setSearchTermSerialNumber] = useState("");
  const [searchTermconstructeur, setSearchTermConstructeur] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [hoveredEquipement, setHoveredEquipement] = useState(null);
  const [propFunctionInfo, setPropFunctionInfo] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await EquipementFinder.get("/");
        setEquipements(response.data.data.equipement);
        setSearchResults(response.data.data.equipement);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setEquipements]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get('/backend', { withCredentials: true });
        setIsAdmin(response.data.role === 'admin');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchTermReference, searchTermName, searchTermModel, searchTermSerialNumber, searchTermconstructeur]);

  const filterResults = () => {
    const filteredResults = equipements.filter(equipement => {
      const reference = equipement.reference ? equipement.reference.toLowerCase() : '';
      const name = equipement.name ? equipement.name.toLowerCase() : '';
      const model = equipement.model ? equipement.model.toLowerCase() : '';
      const serialNumber = equipement.serial_number ? equipement.serial_number.toLowerCase() : '';
      const constructeur = equipement.location ? equipement.location.toLowerCase() : '';
      const dateAdded = new Date(equipement.add_date);

      return (
        reference.includes(searchTermReference.toLowerCase()) &&
        name.includes(searchTermName.toLowerCase()) &&
        model.includes(searchTermModel.toLowerCase()) &&
        serialNumber.includes(searchTermSerialNumber.toLowerCase()) &&
        constructeur.includes(searchTermconstructeur.toLowerCase()) 
      );
    });
    setSearchResults(filteredResults);
  };

  const handleSearchNameChange = (e) => setSearchTermName(e.target.value);
  const handleSearchModelChange = (e) => setSearchTermModel(e.target.value);
  const handleSearchSerialNumberChange = (e) => setSearchTermSerialNumber(e.target.value);
  const handleSearchConstChange = (e) => setSearchTermConstructeur(e.target.value);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/equipements/${id}/update`);
  };

  const handleDeleteMultiple = async () => {
    try {
      const confirmMessage = "Êtes-vous sûr de vouloir supprimer tout les equipements ?!!";
      const confirmDelete = window.confirm(confirmMessage);
      if (!confirmDelete) return;

      await Promise.all(selectedIds.map(id => EquipementFinder.delete(`/${id}`)));
      setEquipements(equipements.filter((equipement) => !selectedIds.includes(equipement.id)));
      setSearchResults(searchResults.filter((equipement) => !selectedIds.includes(equipement.id)));
      setSelectedIds([]);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
        const response = await axios.get(`/backend/api/v1/equipement/${id}/references`);

        if (response.data.hasReferences) {
            window.alert("Cette machine a d'autres relations. Pour la supprimer, vous devez d'abord supprimer toutes ses relations.");
            return;
        }

        const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?");
        if (!confirmDelete) return;

        await EquipementFinder.delete(`/${id}`);
        setEquipements(equipements.filter((equipement) => equipement.id !== id));
    } catch (err) {
        console.log(err);
    }
};


  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleCheckbox = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(searchResults.map((equipement) => equipement.id));
    } else {
      setSelectedIds([]);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleMouseOver = async (name) => {
    try {
      const response = await axios.get(`/backend/api/v1/equipement/${name}/prop_function`);
      if (response.data.status === 'success' && response.data.data.prop_function.length > 0) {
        setPropFunctionInfo(response.data.data.prop_function[0]);
      } else {
        setPropFunctionInfo(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleMouseLeave = () => {
    setPropFunctionInfo(null);
  };

  const handlecomposant = (e, name) => {
    e.stopPropagation();
    navigate(`Addcomposant/${name}`);
  };

  return (
<div className="content-wrapper">
  <div>
    <div className="table-responsive">
      <div className="table-wrapper">
        <div className="table-title">
          <div className="row">
          <div className="col-sm-6">
              <h6>
  <Link to="/dash" style={{ fontWeight: 'bold' ,color:'#17a2b8'}}>Aceuil</Link>
  <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
  <Link to="" style={{ fontWeight: 'bold',color:'#17a2b8' }}>Liste des Machines</Link>
</h6>

              </div>
          
            {isAdmin && (
              <div className="col-sm-6 text-center">
                <button className="btn btn-info" onClick={() => window.location.href = "/addequipment"}>
                  <i className="fas fa-plus"></i>
                </button>
                <button className="btn btn-danger" onClick={handleDeleteMultiple}>
                  <i className="material-icons">&#xE15C;</i> <span>Supprimer tout</span>
                </button>
              </div>
            )}
          </div>
        
        
            </div>
            <table className="table table-striped custom-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === searchResults.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Nom de Machine</th>
                  <th>Modèle</th>
                  <th>Numéro de série</th>
                  <th>Constructeur</th>
                  <th>Image</th>
                  {isAdmin && <th>Ajout composant</th>}
                  {isAdmin && <th>Details</th>}
                  {isAdmin && <th>Supprimer</th>}
                </tr>
                <tr>
                  <th></th>
                  <th>
  <input 
    type="text"  
    value={searchTermName} 
    onChange={handleSearchNameChange} 
    className="search-input" 
  />
  <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
</th>
<th>
  <input 
    type="text"  
    value={searchTermModel} 
    onChange={handleSearchModelChange} 
    className="search-input" 
  />
  <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
</th>
<th>
  <input 
    type="text"  
    value={searchTermSerialNumber} 
    onChange={handleSearchSerialNumberChange} 
    className="search-input" 
  />
  <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
</th>
<th>
  <input 
    type="text"  
    value={searchTermconstructeur} 
    onChange={handleSearchConstChange} 
    className="search-input" 
  />
  <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
</th>

                  <th>
                  
                  </th>
                  {isAdmin && <th></th>}
                  {isAdmin && <th></th>}
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((equipement) => (
                  <tr key={equipement.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(equipement.id)}
                        onChange={() => toggleCheckbox(equipement.id)}
                      />
                    </td>
                    <td>
                      <div
                        onMouseOver={() => handleMouseOver(equipement.name)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {equipement.name}
                      </div>
                    </td>
                    <td>{equipement.model}</td>
                    <td>{equipement.serial_number}</td>
                    <td>{equipement.location}</td>

                    <td>
                      {equipement.image === null || equipement.image === "" || equipement.image === "null" ? (
                        <span>Aucune image</span>
                      ) : (
                        <img src={mediaUrl(equipement.image)} alt={equipement.name} className="equipement-image" />
                      )}
                    </td>
                    {isAdmin && (
                      <>
                        <td>
                        <button 
  onClick={(e) => handlecomposant(e, equipement.name)} 
  className="btn btn-outline-info"
  style={{ display: 'block', margin: '0 auto' }}
>
  <i className="fas fa-cogs"></i>
</button>

                        </td>
                        <td>
                          <button onClick={(e) => handleUpdate(e, equipement.id)} className="btn btn-outline-success">
                            <i className="far fa-eye"></i>
                          </button>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(equipement.id)} className="btn btn-outline-danger">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <nav>
              <ul className="pagination">
                {Array.from({ length: Math.ceil(searchResults.length / itemsPerPage) }, (_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hint-text">
              Showing {Math.min(indexOfLastItem, searchResults.length)} of {searchResults.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipementList;
