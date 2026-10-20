import React, { useEffect, useState, useContext } from "react";
import ReclamationFinder from '../apis/ReclamationFinder';
import { useNavigate } from 'react-router-dom';
import { ReclamationsContext } from '../context/ReclamationsContext'; 
import axios from 'axios';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Import arrow icons

function Reclamation_tech() {
  const { reclamations, setReclamations } = useContext(ReclamationsContext);    
  const [notifications, setNotifications] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchInputs, setSearchInputs] = useState({
    ref: '',
    equipement_name: '',
    priority: '',
    datepanne: '',
    state:''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ReclamationFinder.get("/");
        setReclamations(response.data.data.reclamations);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setReclamations]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:3001', { withCredentials: true });
        const userRole = response.data.role;
        
        if (userRole === 'technician') {
          const techResponse = await axios.get('http://localhost:3001/api/v1/technicien/techid');
          const technicians = techResponse.data.data.technicien;
          
          if (technicians.length > 0) {
            const connectedTechnician = technicians.find(technician => technician.name === response.data.name);
            
            if (connectedTechnician) {
              const technicianId = connectedTechnician.id;
              const notificationsResponse = await axios.get(`http://localhost:3001/api/v1/notifications/${technicianId}`);
              const notificationsData = notificationsResponse.data.data.notifications;
              
              const updatedNotifications = await Promise.all(
                notificationsData.map(async (notification) => {
                  try {
                    const equipmentRes = await axios.get(`http://localhost:3001/api/v1/notifequip/${notification.equipement_id}`);
                    return {
                      ...notification,
                      equipement_name: equipmentRes.data.data.equipement.name,
                    };
                  } catch (error) {
                    console.error('Error retrieving equipment details:', error);
                    return { ...notification, equipement_name: 'Unknown' };
                  }
                })
              );

              setNotifications(updatedNotifications);
            }
          }
        }
      } catch (error) {
        console.error('Error retrieving notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const handleRowClick = (ref) => {
    window.location.href = `http://localhost:5173/reclamation/Readreclamation/${ref}`;
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedNotifications = React.useMemo(() => {
    let sortableNotifications = [...notifications];
    if (sortConfig.key !== null) {
      sortableNotifications.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableNotifications;
  }, [notifications, sortConfig]);

  const filteredNotifications = React.useMemo(() => {
    return sortedNotifications.filter(notification => {
      return (
        notification.ref.toLowerCase().includes(searchInputs.ref.toLowerCase()) &&
        notification.equipement_name.toLowerCase().includes(searchInputs.equipement_name.toLowerCase()) &&
        notification.priority.toLowerCase().includes(searchInputs.priority.toLowerCase()) &&
        new Date(notification.datepanne).toLocaleString().toLowerCase().includes(searchInputs.datepanne.toLowerCase())&&
        notification.state.toLowerCase().includes(searchInputs.state.toLowerCase()) 

      );
    });
  }, [sortedNotifications, searchInputs]);

  const handleSearchChange = (e) => {
    setSearchInputs({
      ...searchInputs,
      [e.target.name]: e.target.value
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return (
        <>
          <FaArrowUp color={sortConfig.direction === 'ascending' ? 'black' : 'lightgray'} />
          <FaArrowDown color={sortConfig.direction === 'descending' ? 'black' : 'lightgray'} />
        </>
      );
    }
    return (
      <>
        <FaArrowUp color="lightgray" />
        <FaArrowDown color="lightgray" />
      </>
    );
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>Maintenance Corrective</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item"><a href="http://localhost:5173/equipment">Equipement</a></li>
                  <li className="breadcrumb-item active">Maintenance Corrective</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Liste des maintenances corrective</h3>
          </div>
          <div className="card-body">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th onClick={() => handleSort('ref')} style={{cursor: 'pointer'}}>
                    Reference {renderSortArrow('ref')}
                  </th>
                  <th onClick={() => handleSort('equipement_name')} style={{cursor: 'pointer'}}>
                    Nom Machine {renderSortArrow('equipement_name')}
                  </th>
                  <th onClick={() => handleSort('priority')} style={{cursor: 'pointer'}}>
                    Priorité {renderSortArrow('priority')}
                  </th>
                  <th onClick={() => handleSort('datepanne')} style={{cursor: 'pointer'}}>
                    Date Panne {renderSortArrow('datepanne')}
                  </th>
                  <th onClick={() => handleSort('state')} style={{cursor: 'pointer'}}>
                    State {renderSortArrow('datepanne')}
                  </th>
                </tr>
                <tr>
                  <th>
                    <input
                      type="text"
                      name="ref"
                      value={searchInputs.ref}
                      onChange={handleSearchChange}
                      placeholder="Search Reference"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="equipement_name"
                      value={searchInputs.equipement_name}
                      onChange={handleSearchChange}
                      placeholder="Search Nom Machine"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="priority"
                      value={searchInputs.priority}
                      onChange={handleSearchChange}
                      placeholder="Search Priorité"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      name="datepanne"
                      value={searchInputs.datepanne}
                      onChange={handleSearchChange}
                      placeholder="Search Date Panne"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(notification => (
                  <tr key={notification.ref} onClick={() => handleRowClick(notification.ref)} style={{cursor: 'pointer'}} onMouseOver={(e) => e.target.parentNode.style.backgroundColor = '#f0f0f0'} onMouseOut={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}>
                    <td>{notification.ref}</td>
                    <td>{notification.equipement_name}</td>
                    <td>{notification.priority}</td>
                    <td>{new Date(notification.datepanne).toLocaleString()}</td>
                    <td>{notification.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <aside className="control-sidebar control-sidebar-dark">
        {/* Control sidebar content goes here */}
      </aside>
    </div>
  );
}

export default Reclamation_tech;
