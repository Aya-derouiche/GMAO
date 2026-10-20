import React, { Component } from 'react';
import axios from 'axios';
import './Header.css';

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: false,
      name: "",
      userid: "",
      technicien_id: '',
      message: '',
      isAdmin: false,
      isEmployee: false,
      isTechnician: false,
      notifications: [],
      notifprevunique: [],
      maintenance_prev: [],
      notifprevcompunique: [],
      maintenance_prevcomp: [],
      notifemp: [],
      viewedNotifications: new Set(),
    };
  }

  componentDidMount() {
    axios.get('http://localhost:3001', { withCredentials: true })
      .then(res => {
        if (res.data.status === "Success") {
          this.setState({ auth: true, name: res.data.name, userid: res.data.userid });
          this.loadUserRole(res.data.role, res.data.name);
        } else {
          this.setState({ auth: false, message: res.data.message });
        }
      })
      .catch(error => {
        console.error('Error retrieving data:', error);
      });

    // Load viewed notifications from local storage
    const viewedNotifications = new Set(JSON.parse(localStorage.getItem('viewedNotifications')) || []);
    this.setState({ viewedNotifications });
  }

  loadUserRole(userRole, userName) {
    if (userRole === 'technician') {
      this.setState({ isTechnician: true });
      axios.get('http://localhost:3001/api/v1/technicien/techid')
        .then(res => {
          const technicians = res.data.data.technicien;
          const connectedTechnician = technicians.find(technician => technician.name === userName);
          if (connectedTechnician) {
            const technicianId = connectedTechnician.id;
            this.setState({ technicien_id: technicianId });
            this.loadTechnicianData(technicianId);
          } else {
            console.error('No technician found for the connected user.');
          }
        })
        .catch(error => {
          console.error('Error retrieving technician ID:', error);
        });
    } else if (userRole === 'admin') {
      this.setState({ isAdmin: true });
      this.loadAdminData();
    } else if (userRole === 'employee') {
      this.setState({ isEmployee: true });
      this.loadEmployeeData();
    }
  }
  loadTechnicianData(technicianId) {
    axios.get(`http://localhost:3001/api/v1/notifications/${technicianId}`)
      .then(res => {
        const notifications = res.data.data.notifications;
        this.setState({ notifications });
  
        notifications.forEach(notification => {
          if (notification.equipement_id) {
            axios.get(`http://localhost:3001/api/v1/notifequip/${notification.equipement_id}`)
              .then(res => {
                const equipmentName = res.data.data.equipement.name;
                notification.equipmentName = equipmentName;
                this.setState({ notifications: [...this.state.notifications] });
              })
              .catch(error => {
                console.error('Error retrieving equipment details:', error);
              });
          }
  
          if (notification.composant_id) {
            axios.get(`http://localhost:3001/api/v1/notifcomp/${notification.composant_id}`)
              .then(res => {
                const composantName = res.data.data.composant.name_comp;
                notification.composantName = composantName;
                this.setState({ notifications: [...this.state.notifications] });
              })
              .catch(error => {
                console.error('Error retrieving composant details:', error);
              });
          }
        });
      })
      .catch(error => {
        console.error('Error retrieving notifications:', error);
      });
  
    axios.get(`http://localhost:3001/api/v1/notifprevuniquetech/${technicianId}`)
      .then(res => {
        const notifprevunique = res.data.data.notifprevunique;
        this.setState({ notifprevunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications:', error);
      });
      axios.get(`http://localhost:3001/api/v1/notifprevcompuniquetech/${technicianId}`)
      .then(res => {
        const notifprevcompunique = res.data.data.notifprevcompunique;
        this.setState({ notifprevcompunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications for component:', error);
      });
  
    axios.get(`http://localhost:3001/api/v1/maintenance_prevtech/${technicianId}`)
      .then(res => {
        const maintenance_prev = res.data.data.maintenance_prev;
        this.setState({ maintenance_prev });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications by period:', error);
      });
  
    axios.get(`http://localhost:3001/api/v1/notifprevcompuniquetech/${technicianId}`)
      .then(res => {
        const notifprevcompunique = res.data.data.notifprevcompunique;
        this.setState({ notifprevcompunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/notifprevcompuniquetech')
      .then(res => {
        const notifprevcompunique = res.data.data.notifprevcompunique;
        this.setState({ notifprevcompunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications for component:', error);
      });
  
    axios.get(`http://localhost:3001/api/v1/maintenance_prevcomptech/${technicianId}`)
      .then(res => {
        const maintenance_prevcomp = res.data.data.maintenance_prevcomp;
        this.setState({ maintenance_prevcomp });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications by period:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/maintenance_prevcomp')
      .then(res => {
        const maintenance_prevcomp = res.data.data.maintenance_prevcomp;
        this.setState({ maintenance_prevcomp });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications by period for component:', error);
      });
  }
  
  loadAdminData() {
    axios.get('http://localhost:3001/api/v1/notifications_admin')
      .then(res => {
        const notifications = res.data.results;
        this.setState({ notifications });
  
        notifications.forEach(notification => {
          if (notification.equipement_id) {
            axios.get(`http://localhost:3001/api/v1/notifequip/${notification.equipement_id}`)
              .then(res => {
                const equipmentName = res.data.data.equipement.name;
                notification.equipmentName = equipmentName;
                this.setState({ notifications: [...this.state.notifications] });
              })
              .catch(error => {
                console.error('Error retrieving equipment details:', error);
              });
          }
  
          if (notification.composant_id) {
            axios.get(`http://localhost:3001/api/v1/notifcomp/${notification.composant_id}`)
              .then(res => {
                const composantName = res.data.data.composant.name_comp;
                notification.composantName = composantName;
                this.setState({ notifications: [...this.state.notifications] });
              })
              .catch(error => {
                console.error('Error retrieving composant details:', error);
              });
          }
        });
      })
      .catch(error => {
        console.error('Error retrieving user data:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/notifprevunique')
      .then(res => {
        const notifprevunique = res.data.data.notifprevunique;
        this.setState({ notifprevunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/notifprevcompuniquetech')
      .then(res => {
        const notifprevcompunique = res.data.data.notifprevcompunique;
        this.setState({ notifprevcompunique });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications for component:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/maintenance_prev')
      .then(res => {
        const maintenance_prev = res.data.data.maintenance_prev;
        this.setState({ maintenance_prev });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications by period:', error);
      });
  
    axios.get('http://localhost:3001/api/v1/maintenance_prevcomp')
      .then(res => {
        const maintenance_prevcomp = res.data.data.maintenance_prevcomp;
        this.setState({ maintenance_prevcomp });
      })
      .catch(error => {
        console.error('Error retrieving preventive notifications by period for component:', error);
      });
  }
  
  loadEmployeeData() {
    axios.get('http://localhost:3001/api/v1/notifempadm')
      .then(res => {
        const notifemp = res.data.notifemp;
        this.setState({ notifemp });

        const maintenancePrev = res.data.data.maintenancePrev;
        this.setState({ maintenancePrev });

        const reclamation = res.data.data.reclamation;
        this.setState({ reclamation });

        // Load viewed notifications from local storage
        const viewedNotifications = new Set(JSON.parse(localStorage.getItem('viewedNotifications')) || []);
        this.setState({ viewedNotifications });
      })
      .catch(error => {
        console.error('Error retrieving employee notifications:', error);
      });
  }

  handleNotificationClick = () => {
    const { notifemp } = this.state;
    const viewedNotifications = new Set(notifemp.map(notification => notification.id));
    this.setState({ viewedNotifications }, () => {
      localStorage.setItem('viewedNotifications', JSON.stringify([...viewedNotifications]));
    });
  }

  render() {
    const { auth, isAdmin, isEmployee, isTechnician, technicien_id, notifications, notifprevunique, maintenance_prev, notifprevcompunique, maintenance_prevcomp, notifemp, viewedNotifications } = this.state;
    const newNotificationsCount = isEmployee ? notifemp.filter(notification => !viewedNotifications.has(notification.id)).length : 0;

    return (
      <div>
        <nav className="main-header navbar navbar-expand navbar-white navbar-light">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" data-widget="pushmenu" href="#" role="button"><i className="fas fa-bars"></i></a>
            </li> 
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {(isAdmin || isTechnician) && (
  <li className="nav-item d-none d-sm-inline-block">
    <button 
      onClick={() => window.location.href = 'http://localhost:5173/addcurrent'} 
      className="nav-link wink-red" 
      style={{ 
        color: '#659c93db', 
        background: 'none', 
        border: '1px solid #659c93db', 
        padding: 0, 
        cursor: 'pointer' 
      }}
    >
     '' Mettre à jour les données de production ''
    </button>
  </li>
)}
            {auth && (
              <li className="nav-item d-none d-sm-inline-block">
                <a href="#" className="nav-link">{technicien_id}</a>
              </li>
            )}
          </ul>
          <ul className="navbar-nav ml-auto">
            <li className="nav-item dropdown">
              <a className="nav-link" data-toggle="dropdown" href="#" onClick={this.handleNotificationClick}>
                <i className="far fa-bell"></i>
                <span className="badge badge-danger navbar-badge">{isEmployee ? newNotificationsCount : notifications.length}</span>
              </a>
              <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                {isAdmin || isTechnician ? (
                  notifications.slice(-4).map(notification => (
                    <div key={notification.ref}>
                      <a href={isAdmin ? "http://localhost:5173/reclamation" : "http://localhost:5173/reclamation_tech"} className="dropdown-item">
                        <div className="media">
                          <img src="dist/img/claim2.png" alt="User Avatar" className="mr-2 img-circle" style={{ width: '15px', height: '15px' }} />
                          <div className="media-body">
                            <h3 className="dropdown-item-title">
                              {notification.equipmentName}({notification.ref})
                              <span className={`float-right text-sm ${this.getPriorityColor(notification.priority)}`}><i className="fas fa-star"></i></span>
                            </h3>
                            <p className="text-sm">Priority: {notification.priority}</p>
                         
                           
                            {notification.composantName && (
                            <p className="text-sm">Composant: {notification.composantName}</p>
                          )}              
                                    
                                      </div>
                        </div>
                      </a>
                      <div className="dropdown-divider"></div>
                    </div>
                  ))
                ) : (
                  notifemp.slice(-4).map((notification, index) => (
                    <div key={index} style={{ backgroundColor: viewedNotifications.has(notification.id) ? 'lightgrey' : 'white' }}>
                      <a href="#" className="dropdown-item">
                        <div className="media">
                          <img src="dist/img/claim2.png" alt="User Avatar" className="mr-2 img-circle" style={{ width: '15px', height: '15px' }} />
                          <div className="media-body">
                            <h3 className="dropdown-item-title">
                              {notification.name}
                              <span className={`float-right text-sm text-primary`}><i className="fas fa-check"></i></span>
                            </h3>
                            <p className="text-sm">State: {notification.state}</p>
                          </div>
                        </div>
                      </a>
                      <div className="dropdown-divider"></div>
                    </div>
                  ))
                )}
              </div>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link" data-toggle="dropdown" href="#">
                <i className="far fa-clock" />
                <span className="badge badge-danger navbar-badge">{notifprevunique.length + maintenance_prev.length + notifprevcompunique.length + maintenance_prevcomp.length}</span>
              </a>
              <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                {isAdmin ? (
                  <>
                    <a href="http://localhost:5173/maintenance_table" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives par produit</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{notifprevunique.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                    <a href="http://localhost:5173/maintenance_table_periode" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives par période</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{maintenance_prev.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr></hr>
                    <a href="http://localhost:5173/maintenance_comp_produit_table" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives des composants par produit </p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{notifprevcompunique.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                    <a href="http://localhost:5173/maintenancecomp_periodetable" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances des composants préventives par Periode</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{maintenance_prevcomp.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                  </>
                ) : isTechnician ? (
                  <>
                    <a href="/maintenance_produit_tech" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives par produit</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{notifprevunique.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                    <a href="http://localhost:5173/maintenanceperiodetech" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives par période</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{maintenance_prev.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr></hr>
                    <a href="http://localhost:5173/maintenance_comp_produit_table" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances préventives des composants par produit </p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{notifprevcompunique.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                    <a href="http://localhost:5173/maintenancecomp_periodetable" className="dropdown-item">
                      <div className="media">
                        <div className="media-body">
                          <h3 className="dropdown-item-title">
                            <span className="float-right text-sm text-danger"><i className="fas fa-star" /></span>
                          </h3>
                          <p className="text-sm">Consulter liste des maintenances des composants préventives par Periode</p>
                          <p className="text-sm text-muted"><i className="far fa-clock mr-1" />{maintenance_prevcomp.length}</p>
                        </div>
                      </div>
                    </a>
                    <hr />
                  </>
                ) : null}
              </div>
            </li>
            <li className="nav-item">
              <a className="nav-link" data-widget="fullscreen" href="#" role="button">
                <i className="fas fa-expand-arrows-alt"></i>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" data-widget="control-sidebar" data-controlsidebar-slide="true" href="#" role="button">
                <i className="fas fa-th-large"></i>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    );
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'Urgente':
        return 'text-danger';
      case 'Moyenne':
        return 'text-warning';
      case 'Basse':
        return 'text-primary';
      case 'Élevée':
        return 'text-orange';
      default:
        return '';
    }
  }
}
