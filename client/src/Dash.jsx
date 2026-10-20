import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CalendarPlan from './components/Calendarplan';

function Dash() {
  const [auth, setAuth] = useState(false);
  const [name, setName] = useState("");
  const [userid, setUserid] = useState("");
  const [technicianId, setTechnicianId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isTechnician, setIsTechnician] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifPrevUnique, setNotifPrevUnique] = useState([]);
  const [maintenancePrev, setMaintenancePrev] = useState([]);
  const [notifPrevCompUnique, setNotifPrevCompUnique] = useState([]);
  const [maintenancePrevComp, setMaintenancePrevComp] = useState([]);
  const [notifEmp, setNotifEmp] = useState([]);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [reminderMessage, setReminderMessage] = useState('');
  const [showMessageBox, setShowMessageBox] = useState(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('http://localhost:3001', { credentials: 'include' });
        const data = await res.json();

        if (data.status === "Success") {
          setAuth(true);
          setName(data.name);
          setUserid(data.userid);
          loadUserRole(data.role, data.name);
        } else {
          setAuth(false);
          setReminderMessage(data.message);
        }

        const storedViewedNotifications = new Set(JSON.parse(localStorage.getItem('viewedNotifications')) || []);
        setViewedNotifications(storedViewedNotifications);
      } catch (error) {
        console.error('Error retrieving data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const loadUserRole = async (userRole, userName) => {
    if (userRole === 'technician') {
      setIsTechnician(true);
      try {
        const res = await fetch('http://localhost:3001/api/v1/technicien/techid');
        const data = await res.json();
        const technicians = data.data.technicien;
        const connectedTechnician = technicians.find(technician => technician.name === userName);
        if (connectedTechnician) {
          const technicianId = connectedTechnician.id;
          setTechnicianId(technicianId);
          loadTechnicianData(technicianId);
        } else {
          console.error('No technician found for the connected user.');
        }
      } catch (error) {
        console.error('Error retrieving technician ID:', error);
      }
    } else if (userRole === 'admin') {
      setIsAdmin(true);
      loadAdminData();
    } else if (userRole === 'employee') {
      setIsEmployee(true);
      loadEmployeeData();
    }
  };

  const loadTechnicianData = async (technicianId) => {
    try {
      const notificationsRes = await fetch(`http://localhost:3001/api/v1/notifications/${technicianId}`);
      const notificationsData = await notificationsRes.json();
      setNotifications(notificationsData.data.notifications);

      const notifPrevUniqueRes = await fetch(`http://localhost:3001/api/v1/notifprevuniquetech/${technicianId}`);
      const notifPrevUniqueData = await notifPrevUniqueRes.json();
      setNotifPrevUnique(notifPrevUniqueData.data.notifprevunique);

      const maintenancePrevRes = await fetch(`http://localhost:3001/api/v1/maintenance_prevtech/${technicianId}`);
      const maintenancePrevData = await maintenancePrevRes.json();
      setMaintenancePrev(maintenancePrevData.data.maintenance_prev);
    } catch (error) {
      console.error('Error retrieving technician data:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      const notificationsRes = await fetch('http://localhost:3001/api/v1/notifications_admin');
      const notificationsData = await notificationsRes.json();
      setNotifications(notificationsData.results);

      const notifPrevUniqueRes = await fetch('http://localhost:3001/api/v1/notifprevunique');
      const notifPrevUniqueData = await notifPrevUniqueRes.json();
      setNotifPrevUnique(notifPrevUniqueData.data.notifprevunique);

      const notifPrevCompUniqueRes = await fetch('http://localhost:3001/api/v1/notifprevcompuniquetech');
      const notifPrevCompUniqueData = await notifPrevCompUniqueRes.json();
      setNotifPrevCompUnique(notifPrevCompUniqueData.data.notifprevcompunique);

      const maintenancePrevRes = await fetch('http://localhost:3001/api/v1/maintenance_prev');
      const maintenancePrevData = await maintenancePrevRes.json();
      setMaintenancePrev(maintenancePrevData.data.maintenance_prev);

      const maintenancePrevCompRes = await fetch('http://localhost:3001/api/v1/maintenance_prevcomp');
      const maintenancePrevCompData = await maintenancePrevCompRes.json();
      setMaintenancePrevComp(maintenancePrevCompData.data.maintenance_prevcomp);
    } catch (error) {
      console.error('Error retrieving admin data:', error);
    }
  };

  const loadEmployeeData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/notifempadm');
      const data = await res.json();
      setNotifEmp(data.notifemp);
      setMaintenancePrev(data.data.maintenancePrev);
      // Assuming there's a 'reclamation' field
      // setReclamation(data.data.reclamation);
    } catch (error) {
      console.error('Error retrieving employee notifications:', error);
    }
  };

  useEffect(() => {
    const fetchReminderMessage = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/cron_reminder');
        const data = await res.json();
        setReminderMessage(data.message);
        setShowMessageBox(true);

        setTimeout(() => {
          setShowMessageBox(false);
        }, 60000);
      } catch (error) {
        console.error('Error fetching reminder message:', error);
      }
    };

    fetchReminderMessage();
    const interval = setInterval(fetchReminderMessage, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    window.location.href = 'http://localhost:5173/maintenance_table';
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Dashboard</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right"></ol>
            </div>
          </div>
        </div>
      </div>
      <section className="content">
        <div className="container-fluid">
        {(isAdmin || isTechnician) && (
          <div className="row">
            <div className="col-lg-4 col-6">
              <div className="small-box " style={{ border: "2px solid #17a2b8" }}>
                <div className="inner">
                  <h3 style={{ color: "#17a2b8" }}>{notifications.length}</h3>
                  <p style={{ color: "#17a2b8", fontWeight: "bold" }}>maintenances correctives non traitées</p>
                </div>
                <div className="icon">
                  <i className="fas fa-tools" style={{ color: "#17a2b8", fontSize: "45px" }}></i>
                </div>
                <Link to="http://localhost:5173/reclamation" className="small-box-footer bg-info">
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-6">
              <div className="small-box" style={{ border: '2px solid #BA3C2E' }}>
                <div className="inner">
                  <h3 style={{ color: "#BA3C2E" }}>{notifPrevUnique.length + maintenancePrev.length}</h3>
                  <p style={{ color: "#BA3C2E", fontWeight: "bold" }}>maintenance Préventive pour machine </p>
                </div>
                <div className="icon">
                  <i className="fas fa-hourglass-end" style={{ color: "#BA3C2E", fontSize: "45px" }}></i>
                </div>
                <Link to="http://localhost:5173/maintenance_table" className="small-box-footer" style={{ backgroundColor: "#BA3C2E" }}>
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-6">
              <div className="small-box" style={{ border: '2px solid #19A695' }}>
                <div className="inner">
                  <h3 style={{ color: "#19A695" }}>{notifPrevCompUnique.length + maintenancePrevComp.length}</h3>
                  <p style={{ color: "#19A695", fontWeight: "bold" }}> maintenance Préventive pour composant</p>
                </div>
                <div className="icon">
                  <i className="fas fa-exclamation-triangle" style={{ color: "#19A695", fontSize: "45px" }}></i>
                </div>
                <Link to="http://localhost:5173/maintenance_comp_produit_table" className="small-box-footer" style={{ backgroundColor: "#19A695" }}>
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
          </div>
        )}
          {isEmployee && (
              <div className="row">
                 <div className="col-lg-4 col-6">
                <div className="small-box" style={{ border: '2px solid #BA3C2E' }}>
                  <div className="inner">
                    <h3 style={{ color: "#BA3C2E" }}></h3>
                    <p style={{ color: "#BA3C2E", fontWeight: "bold" }}>Demende d'intervention</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-bullhorn" style={{ color: "#BA3C2E", fontSize: "45px" }}></i>
                  </div>
                  <Link to="http://localhost:5173/reclamation" className="small-box-footer" style={{ backgroundColor: "#BA3C2E" }}>
                    More info <i className="fas fa-arrow-circle-right"></i>
                  </Link>
                </div>
              </div>
             
              <div className="col-lg-4 col-6">
                <div className="small-box" style={{ border: '2px solid #19A695' }}>
                  <div className="inner">
                    <h3 style={{ color: "#19A695" }}></h3>
                    <p style={{ color: "#19A695", fontWeight: "bold" }}> Voir les états des maintenances</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-tag" style={{ color: "#19A695", fontSize: "45px" }}></i>
                  </div>
                  <Link to="http://localhost:5173/kanban_board" className="small-box-footer" style={{ backgroundColor: "#19A695" }}>
                    More info <i className="fas fa-arrow-circle-right"></i>
                  </Link>
                </div>
              </div>
              <div className="col-lg-4 col-6">
                <div className="small-box " style={{ border: "2px solid #17a2b8" }}>
                  <div className="inner">
                    <h3 style={{ color: "#17a2b8" }}></h3>
                    <p style={{ color: "#17a2b8", fontWeight: "bold" }}>Liste des machines</p>
                  </div>
                  <div className="icon">
                  <i className="fa fa-cogs" style={{ color: "#17a2b8", fontSize: "45px" }}></i>
                                    </div>
                  <Link to="http://localhost:5173/equipment" className="small-box-footer bg-info">
                    More info <i className="fas fa-arrow-circle-right"></i>
                  </Link>
                </div>
              </div>

            </div>
          )}
          <br /><br /><br />
          <div className='card'>
            <div className="row">
              <div className="col-12">
                <CalendarPlan />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dash;
