import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import Header from './Header';
import Menu from './Menu';
import Footer from './Footer';
import { EquipementsContextProvider } from './context/EquipementsContext';
import { EmployeesContextProvider } from './context/EmployeesContext';
import { Prop_equipsContextProvider } from './context/Prop_equipsContext';
import { SecteursContextProvider } from './context/SecteursContext';
import { ComponentsContextProvider } from './context/ComponentsContext';
import { Prop_functionsContextProvider } from './context/Prop_functionsContext';
import { Prop_componentsContextProvider } from './context/Prop_componentsContext';
import { ReclamationsContextProvider } from './context/ReclamationsContext';
import { InterventionsContextProvider } from './context/InterventionsContext';
import { Affectation_intersContextProvider } from './context/Affectation_intersContext';
import { Component_intersContextProvider } from './context/Component_intersContext';
import Login from './Login';
import Modifymdp from './Modifymdp';
import Home from './routes/Home';
import UpdatePage from './routes/UpdatePage';
import Home2 from './routes/Home2';
import UpdatePage2 from './routes/UpdatePage2';
import Home3 from './routes/Home3';
import UpdatePage3 from './routes/UpdatePage3';
import Home4 from './routes/Home4';
import UpdatePage4 from './routes/UpdatePage4';
import Home5 from './routes/Home5';
import UpdatePage5 from './routes/UpdatePage5';
import Home6 from './routes/Home6';
import UpdatePage6 from './routes/UpdatePage6';
import Home7 from './routes/Home7';
import UpdatePage7 from './routes/UpdatePage7';
import Home8 from './routes/Home8';
import UpdatePage8 from './routes/UpdatePage8';
import Home9 from './routes/Home9';
import UpdatePage9 from './routes/UpdatePage9';
import Home10 from './routes/Home10';
import UpdatePage10 from './routes/UpdatePage10';
import Home11 from './routes/Home11';
import UpdatePage11 from './routes/UpdatePage11';
import Readreclamation from './components/Readreclamation';
import KanbanBoard from './components/KanbanBoard';
import Calendarplan from './components/Calendarplan';
import AddReclamation2 from './components/AddReclamation2';
import Addnomlogo from './components/Addnomlogo';
import Updatenomlogo from './components/Updatenomlogo';
import ReadEquipement from './components/ReadEquipement';
import AddProp_function2 from './components/AddProp_function2';
import AddEquipement from './components/AddEquipement';
import Testpages from './Testpages';
import Ajout_unité from './Ajout_unité';
import Testpage_table from './Testpage_table';
import Maintenancetable from './Maintenancetable';
import Maintenancetableperiode from './Maintenancetableperiode';
import Dash from './Dash';
import Equiplist2 from './Equiplist2';
import Reclamation_tech from './components/Reclamation_tech';
import Maintenanceproduittech from './Maintenanceproduittech';
import Maintenanceperiodetech from './Maintenanceperiodetech';
import AddIntervention from './components/AddIntervention';
import Addcomposant2 from './components/Addcomposant2';
import Updatecomposant2 from './components/Updatecomposant2';
import UpdateEquiprec from './components/UpdateEquiprec';
import UpdateEquipproduit from './components/UpdateEquipproduit';
import UpdateEquipperiode from './components/UpdateEquipperiode';
import Addcurrent from './components/Addcurrent';
import Demandemaintenanceproduit from './Demandemaintenanceproduit';
import MaintenanceCompProduitTable from './Maintenance_comp_produit_table';
import Updatecompproduit from './components/Updatecompproduit';
import Maintenanceproduitcomptech from './Maintenanceproduitcomptech';
import AddPreventive2 from './components/AddPreventive2';
import Historiquemaint from './Historiquemaint';
import Historiquerec from './Historiquerec';
import Homecalendar from './routes/Homecalendar';
import Dashemployee from './Dashemployee';
import Historiquecomp from './Historiquecomp';
import Maintenancecomp_periodetable from './Maintenancecomp_periodetable';

function App() {
  const [message, setMessage] = useState('');
  const [auth, setAuth] = useState(false);
  const [role, setRole] = useState('');
  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios.get('/backend', { withCredentials: true })
      .then(res => {
        if (res.data.status === "Success") {
          setAuth(true);
          setRole(res.data.role);
        } else {
          setAuth(false);
          setMessage(res.data.message);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setMessage('Failed to fetch data');
      });
  }, []);

  const handleLogout = () => {
    axios.get('/backend/api/v1/logout')
      .then((res) => {
        if (res.data.status === "Success") {
          window.location.reload();
        } else {
          alert("You're logged out");
          window.location.reload();
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/*"
          element={
            message ? (
              <Navigate to="/" />
            ) : (
              <ProtectedRoutes role={role} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoutes({ role }) {
  const location = useLocation();

  if (location.pathname === "/") {
    return null;
  }
  return (
    <div className="wrapper">
      <Header />
      <Menu />
      <div className="main-content container-fluid" style={{ backgroundColor: 'white' }}>
        { (role === "employee" || role === "admin" || role === "technician" ) && (
          <EquipementsContextProvider>
            <Routes>
              <Route path="/equipment" element={<Home />} />
              <Route path="/addequipment" element={<AddEquipement />} />
              <Route path="/equipements/:id/update" element={<UpdatePage />} />
              <Route path="/equipment/ReadEquipement/:name" element={<ReadEquipement />} />
              <Route path="/equipment/Addcomposant/:name" element={<Addcomposant2 />} />
              <Route path="/equipment/:id/Updatecomposant2" element={<Updatecomposant2 />} />
              <Route path="/equipements/:id/updaterec" element={<UpdateEquiprec />} />
              <Route path="/equipements/:id/updateequipproduit" element={<UpdateEquipproduit />} />
              <Route path="/equipements/:id/updateequipperiode" element={<UpdateEquipperiode />} />
              <Route path="/equipment/:id/Updatecompproduit" element={<Updatecompproduit />} />
              <Route path="/addcurrent" element={<Addcurrent />} />
            </Routes>
          </EquipementsContextProvider>
        )}

        { role === "admin" && (
          <EmployeesContextProvider>
            <Routes>
              <Route path='/employee' element={<Home2 />} />
              <Route path='/employees/:id/update' element={<UpdatePage2 />} />
            </Routes>
          </EmployeesContextProvider>
        )}

        <SecteursContextProvider>
          <Routes>
            <Route path='/secteur' element={<Home3 />} />
            <Route path='/secteurs/:id/update' element={<UpdatePage3 />} />
          </Routes>
        </SecteursContextProvider>

        <ComponentsContextProvider>
          <Routes>
            <Route path='/component' element={<Home4 />} />
            <Route path='/components/:id/update' element={<UpdatePage4 />} />
          </Routes>
        </ComponentsContextProvider>

        <Prop_equipsContextProvider>
          <Routes>
            <Route path='/prop_equip' element={<Home5 />} />
            <Route path='/prop_equips/:id/update' element={<UpdatePage5 />} />
          </Routes>
        </Prop_equipsContextProvider>

        <Prop_functionsContextProvider>
          <Routes>
            <Route path='/prop_function' element={<Home6 />} />
            <Route path='/prop_functions/:id/update' element={<UpdatePage6 />} />
            <Route path="/ReadEquipement/:name/AddProp_function2/:equipment_id" element={<AddProp_function2 />} />
          </Routes>
        </Prop_functionsContextProvider>

        <Prop_componentsContextProvider>
          <Routes>
            <Route path='/prop_component' element={<Home7 />} />
            <Route path='/prop_components/:id/update' element={<UpdatePage7 />} />
          </Routes>
        </Prop_componentsContextProvider>

        { (role === "employee" || role === "admin" || role === "technician" ) && (
          <ReclamationsContextProvider>
            <Routes>
              <Route path='/reclamation' element={<Home8 />} />
              <Route path='/reclamations/:id/update' element={<UpdatePage8 />} />
              <Route path='/reclamation/Readreclamation/:ref' element={<Readreclamation />} />
              <Route path='/demande_reclamation' element={<AddReclamation2 />} />
              <Route path='/demande_predictive' element={<AddPreventive2 />} />
              <Route path='/kanban_board' element={<KanbanBoard />} />
              <Route path='/reclamation_tech' element={<Reclamation_tech />} />
            </Routes>
          </ReclamationsContextProvider>
        )}

        <InterventionsContextProvider>
          <Routes>
            <Route path='/intervention' element={<Home9 />} />
            <Route path='/interventions/:id/update' element={<UpdatePage9 />} />
            <Route path='/Calendarplan' element={<Calendarplan />} />
            <Route path='/intervention/AddIntervention' element={<AddIntervention />} />
          </Routes>
        </InterventionsContextProvider>

        <Affectation_intersContextProvider>
          <Routes>
            <Route path='/affectation_inter' element={<Home10 />} />
            <Route path='/affectation_inters/:id/update' element={<UpdatePage10 />} />
          </Routes>
        </Affectation_intersContextProvider>

        <Component_intersContextProvider>
          <Routes>
            <Route path='/component_inter' element={<Home11 />} />
            <Route path='/component_inters/:id/update' element={<UpdatePage11 />} />
          </Routes>
        </Component_intersContextProvider>

        <Routes>
          <Route path="/modifymdp" element={<Modifymdp />} />
          <Route path="/addnomlogo" element={<Addnomlogo />} />
          <Route path="/updatenomlogo" element={<Updatenomlogo />} />
          <Route path='/testpages' element={<Testpages />} />
          <Route path='/ajout_unité' element={<Ajout_unité />} />
          <Route path='/testpage_table' element={<Testpage_table />} />
          <Route path='/maintenance_table' element={<Maintenancetable />} />
          <Route path='/maintenance_table_periode' element={<Maintenancetableperiode />} />
          <Route path='/maintenancecomp_periodetable' element={<Maintenancecomp_periodetable />} />

          <Route path='/dash' element={<Dash />} />
          <Route path='/equiplist2' element={<Equiplist2 />} />
          <Route path='/maintenance_produit_tech' element={<Maintenanceproduittech />} />
          <Route path='/maintenance_periode_tech' element={<Maintenanceperiodetech />} />
          <Route path='/demande_maintenance_produit' element={<Demandemaintenanceproduit />} />
          <Route path='/maintenance_comp_produit_table' element={<MaintenanceCompProduitTable />} />
          <Route path='/maintenance_produit_comp_tech' element={<Maintenanceproduitcomptech />} />
          <Route path='/historique_maint' element={< Historiquemaint/>} />
          <Route path='/historiquerec' element={< Historiquerec/>} />

          <Route path='/calendar' element={< Homecalendar/>} />
          <Route path='/dashemp' element={< Dashemployee/>} />
          <Route path='/historiquecomp' element={< Historiquecomp/>} />


        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
