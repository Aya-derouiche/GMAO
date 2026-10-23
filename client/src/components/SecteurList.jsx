import React, { useEffect, useState, useContext } from "react";
import axios from 'axios';
import SecteurFinder from '../apis/SecteurFinder';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

import { SecteursContext } from '../context/SecteursContext';
import "./secteurList.css";
import AddSecteur from './AddSecteur';

const SecteurList = () => {
  const { secteurs, setSecteurs } = useContext(SecteursContext);
  const navigate = useNavigate();

  const [searchTermRef, setSearchTermRef] = useState("");
  const [searchTermLib, setSearchTermLib] = useState("");
  const [searchTermDescription, setSearchTermDescription] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [showAddSecteur, setShowAddSecteur] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTechnician, setIsTechnician] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await SecteurFinder.get("/");
        setSecteurs(response.data.data.secteurs);
        setSearchResults(response.data.data.secteurs);
        setLoadError("");
      } catch (err) {
        console.error(err);
        const message = err.response?.data?.message || err.message || "Erreur inconnue";
        setLoadError(`Chargement impossible (HTTP ${err.response?.status || "réseau"}) : ${message}`);
        toast.error("Impossible de charger les secteurs. Consultez le message affiché dans la page.");
      }
    };

    fetchData();
  }, [setSecteurs]);

  const toggleAddSecteur = () => {
    setShowAddSecteur(!showAddSecteur);
  };

  useEffect(() => {
    filterResults();
  }, [searchTermRef, searchTermLib, searchTermDescription]);

  const filterResults = () => {
    const filteredResults = secteurs.filter(secteur => {
      const ref = secteur.ref ? secteur.ref.toLowerCase() : '';
      const lib = secteur.lib ? secteur.lib.toLowerCase() : '';
      const description = secteur.description ? secteur.description.toLowerCase() : '';

      return (
        ref.includes(searchTermRef.toLowerCase()) &&
        lib.includes(searchTermLib.toLowerCase()) &&
        description.includes(searchTermDescription.toLowerCase())
      );
    });
    setSearchResults(filteredResults);
  };

  const handleSearchRefChange = (e) => setSearchTermRef(e.target.value);
  const handleSearchLibChange = (e) => setSearchTermLib(e.target.value);
  const handleSearchDescriptionChange = (e) => setSearchTermDescription(e.target.value);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/secteurs/${id}/update`);
  };

  const handleDeleteMultiple = async () => {
    try {
      const confirmMessage = "Êtes-vous sûr de vouloir supprimer ces secteurs ?";
      const confirmDelete = window.confirm(confirmMessage);
      if (!confirmDelete) return;

      await Promise.all(selectedIds.map(id => SecteurFinder.delete(`/${id}`)));
      setSecteurs(secteurs.filter((secteur) => !selectedIds.includes(secteur.id)));
      setSearchResults(searchResults.filter((secteur) => !selectedIds.includes(secteur.id)));
      setSelectedIds([]);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get('/backend', { withCredentials: true });
        setIsAdmin(response.data.role === 'admin');
        setIsTechnician(response.data.role === 'technician');
        setIsEmployee(response.data.role === 'employee');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    checkAdmin();
  }, []);

  const handleDeleteSingle = async (id) => {
    try {
      const confirmMessage = "Êtes-vous sûr de vouloir supprimer ce secteur ?";
      const confirmDelete = window.confirm(confirmMessage);
      if (!confirmDelete) return;

      await SecteurFinder.delete(`/${id}`);
      setSecteurs(secteurs.filter((secteur) => secteur.id !== id));
      setSearchResults(searchResults.filter((secteur) => secteur.id !== id));
    } catch (err) {
      console.log(err);
    }
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
      setSelectedIds(searchResults.map((secteur) => secteur.id));
    } else {
      setSelectedIds([]);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="content-wrapper">
      <div className="container-xl">
        <div className="table-responsive">
          <div className="table-wrapper">
            <div className="table-title">
              <div className="row">

                <div className="col-sm-6">
                  {/* Add other buttons if needed */}
                 
              <h6>
  <Link to="/dash" style={{ fontWeight: 'bold' ,color:'#17a2b8'}}>Aceuil</Link>
  <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
  <Link to="" style={{ fontWeight: 'bold',color:'#17a2b8' }}>Liste des Secteurs</Link>
</h6>

                </div>
                {isAdmin && (
                <div className="col-sm-6">
                  <button className="btn btn-info" onClick={toggleAddSecteur}>
                    <i className="fas fa-plus"></i>
                  </button>
                  {showAddSecteur && (
                    <div className="popup-container">
                      <div className="popup">
                        <AddSecteur hideAddSecteur={toggleAddSecteur} />
                      </div>
                    </div>
                  )}
                  <button className="btn btn-danger" onClick={handleDeleteMultiple}>
                    <i className="material-icons">&#xE15C;</i> <span>Supprimer tout</span>
                  </button>
                </div>
                )}
              </div>
            </div>
            <table className="table table-striped">
              <thead>
                <tr>
                {isAdmin &&  <th>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === searchResults.length}
                      onChange={handleSelectAll}
                    />
                  </th>}
                  <th>Référence</th>
                  <th>Nom</th>
                  <th>Description</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
                <tr>
                {isAdmin &&  <th></th>}
                  <th><input type="text" placeholder="Search Référence" value={searchTermRef} onChange={handleSearchRefChange} style={{ width: '100px' }} /></th>
                  <th><input type="text" placeholder="Search Nom" value={searchTermLib} onChange={handleSearchLibChange} style={{ width: '100px' }} /></th>
                  <th><input type="text" placeholder="Search Description" value={searchTermDescription} onChange={handleSearchDescriptionChange} style={{ width: '100px' }} /></th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {loadError && <tr><td colSpan={isAdmin ? 5 : 3} role="alert">{loadError}</td></tr>}
                {currentItems.map(secteur => (
                  <tr key={secteur.id}>
                   {isAdmin &&   <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(secteur.id)}
                        onChange={() => toggleCheckbox(secteur.id)}
                      />
                    </td>}
                    <td>{secteur.ref}</td>
                    <td>{secteur.lib}</td>
                    <td>{secteur.description}</td>
                  
                    {(isAdmin ) && (
                                                    <>
                                                        <td>
                                                            <button onClick={(e) => handleUpdate(e, secteur.id)} className="btn btn-outline-secondary">
                                                                <i className="fas fa-pencil-alt"></i>
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <button onClick={() => handleDelete(secteur.id)} className="btn btn-outline-danger">
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

export default SecteurList;
