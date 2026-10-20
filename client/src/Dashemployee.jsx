import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CalendarPlan from './components/Calendarplan';

function Dashemployee() {
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
        const res = await fetch('/backend', { credentials: 'include' });
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


  const loadEmployeeData = async () => {
    try {
      const res = await fetch('/backend/api/v1/notifempadm');
      const data = await res.json();
      setNotifEmp(data.notifemp);
      setMaintenancePrev(data.data.maintenancePrev);
      // Assuming there's a 'reclamation' field
      // setReclamation(data.data.reclamation);
    } catch (error) {
      console.error('Error retrieving employee notifications:', error);
    }
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
          <div className="row">
            <div className="col-lg-4 col-6">
              
              <div className="small-box" style={{ border: '2px solid #BA3C2E' }}>
                <div className="inner">
                  <h3 style={{ color: "#BA3C2E" }}></h3>
                  <p style={{ color: "#BA3C2E", fontWeight: "bold" }}>Demende d'intervention </p>
                </div>
                <div className="icon">
                  <i className="fas fa-hourglass-end"style={{color: "#BA3C2E", fontSize:"45px"}}></i>
                </div>
                <Link to="#" className="small-box-footer" style={{backgroundColor: "#BA3C2E"}}>
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
            <div className="col-lg-4 col-6">
              <div className="small-box" style={{border: '2px solid #19A695' }}>
                <div className="inner">
                  <h3 style={{ color: "#19A695" }}></h3>
                  <p style={{ color: "#19A695" , fontWeight: "bold"}}> maintenances Maintenance En cours</p>
                </div>
                <div className="icon">
                  <i className="fas fa-exclamation-triangle"style={{color: "#19A695", fontSize:"45px"}}></i>
                </div>
                <Link to="#" className="small-box-footer" style={{backgroundColor: "#19A695"}}>
                  More info <i className="fas fa-arrow-circle-right"></i>
                </Link>
              </div>
            </div>
          </div>
          <br></br><br></br><br></br>
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

export default Dashemployee;


