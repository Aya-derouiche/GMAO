import React, { useEffect, useState, useContext } from "react";
import EquipementFinder from '../apis/EquipementFinder';
import { Link, useNavigate } from 'react-router-dom';
import { EquipementsContext } from '../context/EquipementsContext';
import axios from 'axios';
import './CurrentList.css';

const Addcurrent = () => {
  const { equipements, setEquipements } = useContext(EquipementsContext);
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTermName, setSearchTermName] = useState("");
  const [searchTermType, setSearchTermType] = useState("");
  const [searchTermCycle, setSearchTermCycle] = useState("");
  const [searchTermCurrentValue, setSearchTermCurrentValue] = useState("");
  const [searchTermLastMaintValue, setSearchTermLastMaintValue] = useState("");
  const [searchTermLastMaintDate, setSearchTermLastMaintDate] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatedValues, setUpdatedValues] = useState({});
  const itemsPerPage = 6;
  const [unit_id, setUnit_id] = useState("");
  const [units, setUnits] = useState([]);
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
    const fetchUnits = async () => {
      try {
        const equipementData = {}; // Add appropriate data or logic to get equipementData if needed.
        if (equipementData.type === 'Produit') {
          const unitsResponse = await axios.get("http://localhost:3001/api/v1/unitproduit");
          setUnits(unitsResponse.data.data.unit);
        } else if (equipementData.type === 'Periode') {
          const unitsResponse = await axios.get("http://localhost:3001/api/v1/unitperiode");
          setUnits(unitsResponse.data.data.unit);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnits();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get('http://localhost:3001', { withCredentials: true });
        setIsAdmin(response.data.role === 'admin');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchTermName, searchTermType, searchTermCycle, searchTermCurrentValue, searchTermLastMaintValue, searchTermLastMaintDate]);

  const filterResults = () => {
    const filteredResults = equipements.filter(equipement => {
      const name = equipement.name ? equipement.name.toLowerCase() : '';
      const type = equipement.type ? equipement.type.toLowerCase() : '';
      const cycle = equipement.cycle ? equipement.cycle.toString().toLowerCase() : '';
      const currentValue = equipement.current_value ? equipement.current_value.toString().toLowerCase() : '';
      const lastMaintValue = equipement.last_maint_value ? equipement.last_maint_value.toString().toLowerCase() : '';
      const lastMaintDate = equipement.last_maint_date ? equipement.last_maint_date.toLowerCase() : '';
  
      // Concatenate cycle value and unit value for comparison
      const cycleWithUnit = `${cycle} ${equipement.unit_unit}`.toLowerCase();
  
      return (
        name.includes(searchTermName.toLowerCase()) &&
        type.includes(searchTermType.toLowerCase()) &&
        (cycleWithUnit.includes(searchTermCycle.toLowerCase()) || searchTermCycle.trim() === '') && // Modified line
        currentValue.includes(searchTermCurrentValue.toLowerCase()) &&
        lastMaintValue.includes(searchTermLastMaintValue.toLowerCase()) &&
        lastMaintDate.includes(searchTermLastMaintDate.toLowerCase())
      );
    });
    setSearchResults(filteredResults);
  };
  

  const handleSearchNameChange = (e) => setSearchTermName(e.target.value);
  const handleSearchTypeChange = (e) => setSearchTermType(e.target.value);
  const handleSearchCycleChange = (e) => setSearchTermCycle(e.target.value);
  const handleSearchCurrentValueChange = (e) => setSearchTermCurrentValue(e.target.value);
  const handleSearchLastMaintValueChange = (e) => setSearchTermLastMaintValue(e.target.value);
  const handleSearchLastMaintDateChange = (e) => setSearchTermLastMaintDate(e.target.value);

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
      const response = await axios.get(`http://localhost:3001/api/v1/equipement/${id}/references`);

      let confirmMessage;
      if (response.data.hasReferences) {
        confirmMessage = "Cet équipement est référencé dans d'autres tables. Il sera supprimé uniquement de cette vue !";
      } else {
        confirmMessage = "Êtes-vous sûr de vouloir supprimer cet équipement ?";
      }

      const confirmDelete = window.confirm(confirmMessage);
      if (!confirmDelete) return;

      await EquipementFinder.delete(`/${id}`);
      setEquipements(equipements.filter((equipement) => equipement.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return " ";

    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
    return new Date(dateString).toLocaleString(undefined, options);
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

  const handleCurrentValueChange = (id, value) => {
    setUpdatedValues({ ...updatedValues, [id]: value });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleMouseOver = async (name) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/equipement/${name}/prop_function`);
      if (response.data.status === 'success' && response.data.data.prop_function.length > 0) {
        setPropFunctionInfo(response.data.data.prop_function[0]);
      } else {
        setPropFunctionInfo(null);
      }
    }
    catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    const handleMouseLeave = () => {
      setPropFunctionInfo(null);
    };
  
    const handleSubmit = async () => {
      const updates = Object.keys(updatedValues).map(id => {
          return {
              id: parseInt(id),
              current_value: parseFloat(updatedValues[id])
          };
      });
  
      try {
          // Update the equipment values
          await axios.put('http://localhost:3001/api/v1/equipement_current', { updates });
          alert('Values updated successfully!');
  
          // Fetch notifications
          const response = await axios.get('http://localhost:3001/api/v1/notifications_prev');
          console.log('Notifications:', response.data); // Handle the response data as needed
  
          // For example, you could display the notifications in the UI
          // displayNotifications(response.data);
  
      } catch (error) {
          console.error('Error updating values or fetching notifications:', error);
          alert('Failed to update values or fetch notifications.');
      }
  };
  
  // Optionally, you might want to add a function to display notifications
  const displayNotifications = (notifications) => {
      // Implement this function to display notifications in your UI
      // For example, you could append them to a notifications section in your HTML
      const notificationsSection = document.getElementById('notifications-section');
      notifications.forEach(notification => {
          const notificationElement = document.createElement('div');
          notificationElement.textContent = notification.message; // Adjust based on your notification structure
          notificationsSection.appendChild(notificationElement);
      });
  };
  
  
    return (
      <div className="content-wrapper">
        <div>
          <div className="table-responsive">
            <div className="table-wrapper">
              <div className="table-title">
                <div className="row">
                  <div className="col-sm-6">
                  <h5 className="card-title">
                                <Link style={{ color: '#3267a0' }} to="/equipment" >Machine</Link>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
                                <Link style={{ color: '#3267a0' }} to="">modifier les valeurs actuelles des machines</Link>
                               
                             
                            </h5>
            
                  </div>
                  {isAdmin && (
                    <div className="col-sm-6 text-center">
                      <button className="btn btn-info" onClick={() => window.location.href = "http://localhost:5173/addequipment"}>
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
    <th>type</th>
    <th>cycle</th>
    <th>actual_value</th> {/* Move this before "nouveau valeur" */}
    <th>DernierValeur</th>
    <th>DernierDateMaintenance</th>
    <th>Nouveau ValeurActuelle</th>
    <th>Details</th>
  </tr>
  <tr>
    <th></th>
    <th className="search-container">
      <input 
        type="text"  
        value={searchTermName} 
        onChange={handleSearchNameChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th className="search-container">
      <input 
        type="text"  
        value={searchTermType} 
        onChange={handleSearchTypeChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th className="search-container">
      <input 
        type="text"  
        value={searchTermCycle}
        onChange={handleSearchCycleChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th className="search-container"> {/* Move search input for actual_value */}
      <input 
        type="text"  
        value={searchTermCurrentValue} 
        onChange={handleSearchCurrentValueChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th className="search-container">
      <input 
        type="text"  
        value={searchTermLastMaintValue} 
        onChange={handleSearchLastMaintValueChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th className="search-container">
      <input 
        type="text"  
        value={searchTermLastMaintDate} 
        onChange={handleSearchLastMaintDateChange} 
        className="search-input" 
      />
      <i className="fas fa-filter filter-icon"></i>
    </th>
    <th></th>
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
      <td onMouseOver={() => handleMouseOver(equipement.name)} onMouseLeave={handleMouseLeave}>
        {equipement.name}
        {hoveredEquipement === equipement.name && propFunctionInfo && (
          <div className="tooltip-container">
            <div className="tooltip-content">
              <p>Valeur actuelle : {propFunctionInfo.prop_value}</p>
              <p>Mesure : {propFunctionInfo.prop_unit}</p>
            </div>
          </div>
        )}
      </td>
      <td>{equipement.type}</td>
      <td>{equipement.cycle} {equipement.unit_unit}</td>
      <td>{equipement.type !== 'Periode' ? equipement.current_value : ""}</td>
      <td>{equipement.type !== 'Periode' ? equipement.last_maint_value : ""}</td>
      <td>{formatDate(equipement.last_maint_date)}</td>
      <td>
        {equipement.type !== 'Periode' && (
          <input
            type="number"
            value={updatedValues[equipement.id] !== undefined ? updatedValues[equipement.id] : equipement.current_value}
            onChange={(e) => handleCurrentValueChange(equipement.id, e.target.value)}
            style={{ width: '90px' }} // Adjust the width as needed
          />
        )}
      </td>
      <td>
        <button onClick={(e) => handleUpdate(e, equipement.id)} className="btn btn-outline-success">
          <i className="far fa-eye"></i>
        </button>
      </td>
    </tr>
  ))}
</tbody>

              </table>
              <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
              <nav>
                <ul className="pagination">
                  {Array.from({ length: Math.ceil(searchResults.length / itemsPerPage) }, (_, i) => (
                    <li key={i} className={`page-item ${i + 1 === currentPage ? 'active' : ''}`}>
                      <button onClick={() => paginate(i + 1)} className="page-link">
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default Addcurrent;
