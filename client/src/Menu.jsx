import React, { Component } from 'react';
import axios from 'axios';
import { NavLink, Link, Navigate } from 'react-router-dom';
import { FaPowerOff } from 'react-icons/fa';
import { mediaUrl } from './utils/mediaUrl';
import './Menu.css';

export default class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: false,
      name: '',
      message: '',
      isAdmin: false,
      isTechnician: false,
      isEmployee: false,
      nomlogo: null,
      equipements: [],
      composantsParEquipement: {},
      dropdowns: {} // Added state to manage dropdowns
    };
  }

  componentDidMount() {
    this.checkAuth();
    this.fetchCompanyDetails();
    this.fetchEquipments();
  }

  checkAuth() {
    axios.get('/backend', { withCredentials: true })
      .then(res => {
        if (res.data.status === "Success") {
          this.setState({
            auth: true,
            name: res.data.name,
            isAdmin: res.data.role === 'admin',
            isTechnician: res.data.role === 'technician',
            isEmployee: res.data.role === 'employee'
          });
        } else {
          this.setState({ auth: false, message: res.data.message });
        }
      })
      .catch(error => {
        console.error('Error fetching authentication data:', error);
      });
  }

  fetchCompanyDetails() {
    axios.get('/backend/api/v1/nomlogo')
      .then(res => {
        if (res.data.status === "success" && res.data.results > 0) {
          this.setState({ nomlogo: res.data.data.nomlogo[0] });
        }
      })
      .catch(error => {
        console.error('Error fetching logo and company name:', error);
      });
  }

  fetchEquipments() {
    axios.get("/backend/api/v1/equipement")
      .then(res => {
        if (res.data.status === "success") {
          this.setState({ equipements: res.data.data.equipement }, () => {
            this.fetchComposantsForEquipements();
          });
        }
      })
      .catch(error => {
        console.error('Error fetching equipment:', error);
      });
  }

  fetchComposantsForEquipements() {
    const { equipements } = this.state;
    equipements.forEach(equipement => {
      axios.get(`/backend/api/v1/composant_equip/${equipement.name}`)
        .then(res => {
          if (res.data.status === "success") {
            this.setState(prevState => ({
              composantsParEquipement: {
                ...prevState.composantsParEquipement,
                [equipement.name]: res.data.data.composants
              }
            }));
          }
        })
        .catch(error => {
          console.error(`Error fetching composants for ${equipement.name}:`, error);
        });
    });
  }

  handleLogout = () => {
    const confirmMessage = "Êtes-vous sûr de vous déconnecter ?";
    const confirmLogout = window.confirm(confirmMessage);

    if (!confirmLogout) return;

    axios.get('/backend/api/v1/logout')
      .then((res) => {
        if (res.data.status === "Success") {
          location.reload(true);
        } else {
          window.confirm("Vous êtes déconnecté. Cliquez sur OK pour recharger la page.");
          window.location.reload();
        }
      })
      .catch((err) => console.log(err));
  };

  toggleDropdown = (menuName) => {
    this.setState(prevState => ({
      dropdowns: {
        ...prevState.dropdowns,
        [menuName]: !prevState.dropdowns[menuName]
      }
    }));
  }

  render() {
    const { auth, name, message, nomlogo, isAdmin, isTechnician, isEmployee, equipements, composantsParEquipement, dropdowns } = this.state;

    if (message) {
      return <Navigate to="/" />;
    }

    return (
      <div>
        <aside className="main-sidebar sidebar-dark-primary elevation-4">
          {nomlogo && (
            <div className="brand-link">
              {isAdmin ? (
                <a href="/updatenomlogo" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <>
                    <img src={mediaUrl(nomlogo.image)} alt="Company Logo" className="brand-image img-circle elevation-3" style={{ opacity: '.8' }} />
                    <span className="brand-text font-weight-light">{nomlogo.name}</span>
                  </>
                </a>
              ) : (
                <>
                  <img src={mediaUrl(nomlogo.image)} alt="Company Logo" className="brand-image img-circle elevation-3" style={{ opacity: '.8' }} />
                  <span className="brand-text font-weight-light">{nomlogo.name}</span>
                </>
              )}
            </div>
          )}
          <div className="sidebar">
            <div className="user-panel mt-3 pb-3 mb-3 d-flex align-items-center">
              <div className="image">
                <img src="dist/img/user2.png" className="img-circle elevation-2" alt="img" />
              </div>
              <div className="info ml-2 d-flex align-items-center">
                {auth && (
                  <div className="d-flex align-items-center">
                    <p className="m-0 mr-2" style={{ color: 'white', fontSize: '18px', whiteSpace: 'nowrap' }}>{name}</p>
                    <button className='btn btn-outline-light' onClick={this.handleLogout}>
                      <FaPowerOff />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <NavLink to="/modifymdp" className="nav-link" activeClassName="active">
              <i className="fas fa-address-card" />&nbsp;
              Modifier votre profil
            </NavLink>
            <hr />
            <nav className="mt-2">
              <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                <li className="nav-item">
                  <NavLink to="/dash" className="nav-link" activeClassName="active">
                    <i className="nav-icon fas fa-tachometer-alt" />
                    <p>Dashboard</p>
                  </NavLink>
                </li>
                {isAdmin && (
                  <li className="nav-item">
                    <NavLink to="/employee" className="nav-link" activeClassName="active" >
                      <i className="nav-icon fas fa-users" />
                      <p>Employée</p>
                    </NavLink>
                  </li>
                )}
                <li className="nav-header"></li>
                <li className={`nav-item has-treeview ${dropdowns['secteurs'] ? 'menu-open' : ''}`}>
                  <a href="#" className="nav-link" onClick={() => this.toggleDropdown('secteurs')}>
                    <i className="nav-icon fas fa-dice-d20"></i>
                    <p>
                      Les secteurs
                      <i className="right fas fa-angle-left"></i>
                    </p>
                  </a>
                  <ul className={`nav nav-treeview ${dropdowns['secteurs'] ? 'd-block' : 'd-none'}`}>
                    <li className="nav-item">
                      <NavLink to="/secteur" className="nav-link" activeClassName="active">
                        <i className="far fa-circle nav-icon" />
                        <p>Liste Secteurs</p>
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="nav-header"></li>
                <li className={`nav-item has-treeview ${dropdowns['equipements'] ? 'menu-open' : ''}`}>
                  <a href="#" className="nav-link" onClick={() => this.toggleDropdown('equipements')}>
                    <i className="nav-icon fas fa-cogs"></i>
                    <p>
                      Equipements
                      <i className="right fas fa-angle-left"></i>
                    </p>
                  </a>
                  <ul className={`nav nav-treeview ${dropdowns['equipements'] ? 'd-block' : 'd-none'}`}>
                    <li className="nav-item">
                      <NavLink to="/equipment" className="nav-link" activeClassName="active">
                        <i className="far fa-circle nav-icon" />
                        <p>Machines</p>
                      </NavLink>
                    </li>
                    {equipements.map(equipement => (
                      <li key={equipement.id} className={`nav-item has-treeview ${dropdowns[equipement.name] ? 'menu-open' : ''}`}>
                        <a href="#" className="nav-link" onClick={() => this.toggleDropdown(equipement.name)}>
                          <i className="fas fa-cog nav-icon"></i>
                          <p>
                            {equipement.name}
                            {composantsParEquipement[equipement.name] && (
                              <span className="badge badge-info right">
                                {composantsParEquipement[equipement.name].length}
                              </span>
                            )}
                            <i className="right fas fa-angle-left"></i>
                          </p>
                        </a>
                        <ul className={`nav nav-treeview ${dropdowns[equipement.name] ? 'd-block' : 'd-none'}`}>
                          {composantsParEquipement[equipement.name] && composantsParEquipement[equipement.name].map(composant => (
                            <li key={composant.id_equip} className="nav-item">
                              <Link to={`/equipment/${composant.id}/Updatecomposant2`} className="nav-link">
                                <i className="far fa-dot-circle nav-icon"></i>
                                <p>{composant.name_comp}</p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="nav-header"></li>
                <li className="nav-item">
                  <NavLink to="/kanban_board" className="nav-link" activeClassName="active">
                    <i className="nav-icon fas fa-columns"></i>
                    <p>Tableau Kanban</p>
                  </NavLink>
                </li>
                <li className="nav-header"></li>
                <li className="nav-item">
                  <NavLink to="/calendar" className="nav-link" activeClassName="active">
                    <i className="nav-icon far fa-calendar-alt" />
                    <p>Calendrier</p>
                  </NavLink>
                </li>
                <li className="nav-header"></li>
                <li className={`nav-item has-treeview ${dropdowns['reclamation'] ? 'menu-open' : ''}`}>
                  <a href="#" className="nav-link" onClick={() => this.toggleDropdown('reclamation')}>
                    <i className="nav-icon fas fa-tools" />
                    <p>
                      Reclamation
                      <i className="fas fa-angle-left right" />
                    </p>
                  </a>
                  <ul className={`nav nav-treeview ${dropdowns['reclamation'] ? 'd-block' : 'd-none'}`}>
                    <li className="nav-item">
                      <NavLink to="/reclamation" className="nav-link" activeClassName="active">
                        <i className="far fa-circle nav-icon" />
                        <p>Listes des reclamations</p>
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink to="/demande_reclamation" className="nav-link" activeClassName="active">
                        <i className="far fa-circle nav-icon" />
                        <p>Demande de reclamation</p>
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="nav-header"></li>
                <li className={`nav-item has-treeview ${dropdowns['predictive'] ? 'menu-open' : ''}`}>
                  <a href="#" className="nav-link" onClick={() => this.toggleDropdown('predictive')}>
                    <i className="nav-icon far fa-lightbulb" />
                    <p>
                      Prédictive
                      <i className="fas fa-angle-left right" />
                    </p>
                  </a>
                  <ul className={`nav nav-treeview ${dropdowns['predictive'] ? 'd-block' : 'd-none'}`}>
                    <li className="nav-item">
                      <NavLink to="/demande_predictive" className="nav-link" activeClassName="active">
                        <i className="far fa-circle nav-icon" />
                        <p>maint Prédictives</p>
                      </NavLink>
                    </li>
                  </ul>
                </li>
                {(isAdmin || isTechnician || isEmployee) && (
                  <>
                    <li className="nav-header">PLUS D'OPTIONS</li>
                    <li className="nav-item">
                      <a href="/ajout_unité" className="nav-link">
                        <i className="nav-icon far fa-circle text-danger" />
                        <p className="text">Ajout unité de mesure</p>
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/historique_maint" className="nav-link">
                        <i className="nav-icon far fa-circle text-warning" />
                        <p>Historique des maintenances machines</p>
                      </a>
                    </li>
                    <li className="nav-item">
                      <a href="/historiquerec" className="nav-link">
                        <i className="nav-icon far fa-circle text-info" />
                        <p>Reclamation par employee</p>
                      </a>
                    </li>

                    <li className="nav-item">
                      <a href="/historiquecomp" className="nav-link">
                        <i className="nav-icon far fa-circle text-success" />
                        <p>historique des maintenances composants</p>
                      </a>
                    </li>
                  </>
                )}
              </ul>
              <br></br><br></br>
            </nav>
          </div>
        </aside>
      </div>
    );
  }
}
