import React, { useEffect, useState, useContext } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { useNavigate } from 'react-router-dom';
import AddReclamation from '../components/AddReclamation';
import { ReclamationsContext } from '../context/ReclamationsContext';
import axios from 'axios';
import './EquipementList.css';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const ReclamationList = () => {
    const { reclamations, setReclamations } = useContext(ReclamationsContext);
    const navigate = useNavigate();
    const [searchResults, setSearchResults] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTechnician, setIsTechnician] = useState(false);
    const [isEmployee, setIsEmployee] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isHovered, setIsHovered] = useState(false);

    const [searchRef, setSearchRef] = useState("");
    const [searchNomMachine, setSearchNomMachine] = useState("");
    const [searchPriorite, setSearchPriorite] = useState("");
    const [searchDatePanne, setSearchDatePanne] = useState("");

    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });

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
        const checkUserRoles = async () => {
            try {
                const response = await axios.get('http://localhost:3001', { withCredentials: true });
                const userRole = response.data.role;
                setIsAdmin(userRole === 'admin');
                setIsTechnician(userRole === 'technician');
                setIsEmployee(userRole === 'employee');
            } catch (error) {
                console.error('Error fetching user roles:', error);
            }
        };
        checkUserRoles();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return " ";

        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    const handleUpdate = (e, id) => {
        e.stopPropagation();
        navigate(`/reclamations/${id}/update`);
    };

    const handleRead = (e, ref) => {
        e.stopPropagation();
        navigate(`/reclamation/Readreclamation/${ref}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réclamation ?")) {
            try {
                await ReclamationFinder.delete(`/${id}`);
                const updatedReclamations = reclamations.filter(reclamation => reclamation.id !== id);
                setReclamations(updatedReclamations);

                // Mise à jour des résultats de recherche avec les filtres actuels
                filterResults();
                window.location.reload();
            } catch (err) {
                console.error('Error deleting reclamation:', err);
            }
        }
    };

    const filterResults = () => {
        setSearchResults(
            reclamations.filter(reclamation =>
                reclamation.ref.toLowerCase().includes(searchRef.toLowerCase()) &&
                reclamation.equipement_name.toLowerCase().includes(searchNomMachine.toLowerCase()) &&
                reclamation.priority.toLowerCase().includes(searchPriorite.toLowerCase()) &&
                (searchDatePanne === "" || formatDate(reclamation.datepanne).toLowerCase().includes(searchDatePanne.toLowerCase()))
            )
        );
    };

    const handleSearchRefChange = (e) => {
        setSearchRef(e.target.value);
        filterResults();
    };

    const handleSearchNomMachineChange = (e) => {
        setSearchNomMachine(e.target.value);
        filterResults();
    };

    const handleSearchPrioriteChange = (e) => {
        setSearchPriorite(e.target.value);
        filterResults();
    };

    const handleSearchDatePanneChange = (e) => {
        setSearchDatePanne(e.target.value);
        filterResults();
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
                return { backgroundColor: '#dddddd', color: '#000000' };
            case 'En cours':
                return { backgroundColor: '#add8e6', color: '#000000' };
            case 'Terminée':
                return { backgroundColor: '#83c083', color: '#000000' };
            default:
                return {};
        }
    };

    const [showAddEquipement, setShowAddEquipement] = useState(false);

    const toggleAddEquipement = () => {
      setShowAddEquipement(!showAddEquipement);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        let sortedResults = [...searchResults].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setSearchResults(sortedResults);
    };

    const renderSortArrow = (key) => {
        const arrowStyle = { color: 'grey', marginLeft: '5px' };
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <span style={arrowStyle}>▲</span> : <span style={arrowStyle}>▼</span>;
        }
        return <span style={arrowStyle}>▲▼</span>;
    };

    return (
        <div className="content-wrapper">
        <div className="table-responsive">
            <div className="table-wrapper">
                <div className="table-title">
                    <div className="row">
                    <div className="col-sm-6">
                    <h6>
  <Link to="/dash" style={{ fontWeight: 'bold' ,color:'#17a2b8'}}>Aceuil</Link>
  <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
  <Link to="" style={{ fontWeight: 'bold',color:'#17a2b8' }}>Liste des reclamations</Link>
</h6>
</div>
              
                        <div className="col-sm-6 text-center">
                            <button className="btn btn-info" onClick={toggleAddEquipement}>
                                <i className="fas fa-bullhorn"></i>
                            </button>
                            {showAddEquipement && (
                                <div className="popup-container">
                                    <div className="popup">
                                        <AddReclamation hideAddEquipement={toggleAddEquipement} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                    <div className="row">
                        <div className="col">
                            <div className="table-responsive">
                                <table className="table table-striped custom-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSort('ref')}>
                                                Référence {renderSortArrow('ref')}
                                            </th>
                                            <th onClick={() => requestSort('equipement_name')}>
                                                Équipement {renderSortArrow('equipement_name')}
                                            </th>
                                            <th onClick={() => requestSort('priority')}>
                                                Priorité {renderSortArrow('priority')}
                                            </th>
                                            <th>État</th>
                                            <th>Créé par</th>
                                            <th onClick={() => requestSort('datepanne')}>
                                                Date de panne {renderSortArrow('datepanne')}
                                            </th>
                                            <th>Statut</th>
                                           <th>Modifier</th>
                                            {(isAdmin || isTechnician) && <th>Supprimer</th>}
                                        </tr>
                                        <tr>
                                            <th>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={searchRef}
                                                        onChange={handleSearchRefChange}
                                                        style={{ width: '100px' }}
                                                    />
                                                    <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                                                </div>
                                            </th>
                                            <th>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={searchNomMachine}
                                                        onChange={handleSearchNomMachineChange}
                                                        style={{ width: '100px' }}
                                                    />
                                                    <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                                                </div>
                                            </th>
                                            <th>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={searchPriorite}
                                                        onChange={handleSearchPrioriteChange}
                                                        style={{ width: '100px' }}
                                                    />
                                                    <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                                                </div>
                                            </th>
                                            <th></th>
                                            <th></th>
                                            <th>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={searchDatePanne}
                                                        onChange={handleSearchDatePanneChange}
                                                        style={{ width: '100px' }}
                                                    />
                                                    <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                                                </div>
                                            </th>
                                            <th></th>
                                            {(isAdmin || isTechnician) && <th></th>}
                                            {(isAdmin || isTechnician) && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(reclamation => (
                                            <tr key={reclamation.id}>
                                                <td
                                                    onClick={(e) => handleRead(e, reclamation.ref)}
                                                    style={{ cursor: 'pointer', fontWeight: isHovered ? 'bold' : 'normal' }}
                                                    onMouseEnter={() => setIsHovered(true)}
                                                    onMouseLeave={() => setIsHovered(false)}
                                                >
                                                    {reclamation.ref}
                                                </td>
                                                <td>{reclamation.equipement_name}</td>
                                                <td>
                                                    <span style={{ padding: '3px 8px', borderRadius: '3px', ...getPriorityColor(reclamation.priority) }}>{reclamation.priority}</span>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '3px 8px', borderRadius: '3px', ...getStateColor(reclamation.state) }}>{reclamation.state}</span>
                                                </td>
                                                <td>{reclamation.created_by}</td>
                                                <td>{formatDate(reclamation.datepanne)}</td>
                                                <td>
    {reclamation.affecter ? 'Affectée' : (
        (isAdmin || isTechnician) && (
            <a href={`http://localhost:5173/reclamation/Readreclamation/${reclamation.ref}`}>
                <button className="btn btn-outline-info">affectée</button>
            </a>
        )
    )}
</td>

                                                        <td>
                                                            <button onClick={(e) => handleUpdate(e, reclamation.id)} className="btn btn-outline-secondary">
                                                                <i className="fas fa-pencil-alt"></i>
                                                            </button>
                                                        </td>
                                                        
                                                {(isAdmin || isTechnician) && (
                                                    <>
                                                        <td>
                                                            <button onClick={() => handleDelete(reclamation.id)} className="btn btn-outline-danger">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {searchResults.length > itemsPerPage && (
                                    <nav>
                                        <ul className="pagination">
                                            {Array.from({ length: Math.ceil(searchResults.length / itemsPerPage) }, (_, i) => (
                                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                )}
                                <div className="hint-text">
                                    Showing {Math.min(indexOfLastItem, searchResults.length)} of {searchResults.length} entries
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReclamationList;
