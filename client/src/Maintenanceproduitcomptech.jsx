import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function Maintenanceproduitcomptech() {
    const [notifprevunique, setNotifprevunique] = useState([]);
    const [technicienId, setTechnicienId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchConfig, setSearchConfig] = useState({
        name_equip: '',
        name_comp: '',
        current_value: '',
        cycle: '',
        last_maint_date: '',
        state: ''
    });
    const [errors, setErrors] = useState({});

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/backend', { withCredentials: true });
                const userRole = response.data.role;

                if (userRole === 'technician') {
                    const techResponse = await axios.get('/backend/api/v1/technicien/techid');
                    const technicians = techResponse.data.data.technicien;

                    if (technicians.length > 0) {
                        const connectedTechnician = technicians.find(technician => technician.name === response.data.name);

                        if (connectedTechnician) {
                            const technicienId = connectedTechnician.id;
                            setTechnicienId(technicienId);
                            const notifResponse = await axios.get(`/backend/api/v1/notifprevcompuniquetech/${technicienId}`);
                            const notifprevuniqueData = notifResponse.data.data.notifprevcompunique;
                            setNotifprevunique(notifprevuniqueData);
                            document.getElementById('technicien-id').value = technicienId; // Update hidden element
                        }
                    }
                }
            } catch (error) {
                console.error('Error retrieving data:', error);
                setErrors({ fetch: 'An error occurred while fetching data.' });
            }
        };

        fetchData();
    }, []);

    const handleRowClick = (id) => {
        window.location.href = `/equipment/${id}/Updatecompproduit`;
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSearchChange = (key, value) => {
        setSearchConfig(prevState => ({ ...prevState, [key]: value }));
    };

    const sortedFilteredNotifprevunique = useMemo(() => {
        let filteredNotifprevunique = notifprevunique.filter(item =>
            item.name_equip.toLowerCase().includes(searchConfig.name_equip.toLowerCase()) &&
            item.name_comp.toLowerCase().includes(searchConfig.name_comp.toLowerCase()) &&
            item.current_value.toString().toLowerCase().includes(searchConfig.current_value.toLowerCase()) &&
            item.cycle.toLowerCase().includes(searchConfig.cycle.toLowerCase()) &&
            formatDate(item.last_maint_date).toLowerCase().includes(searchConfig.last_maint_date.toLowerCase()) &&
            item.state.toLowerCase().includes(searchConfig.state.toLowerCase())
        );

        if (sortConfig.key !== null) {
            filteredNotifprevunique.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle numeric sorting
                if (sortConfig.key === 'current_value') {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }

                // Handle date sorting
                if (sortConfig.key === 'last_maint_date') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredNotifprevunique;
    }, [notifprevunique, sortConfig, searchConfig]);

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
        <div>
            <div className="wrapper">
                <div className="content-wrapper">
                    <section className="content-header">
                        <div className="container-fluid">
                            <div className="row mb-2">
                                <div className="col-sm-6">
                                    <h1>Maintenance Préventive</h1>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb float-sm-right">
                                        <li className="breadcrumb-item"><a href="/equipment">Equipement</a></li>
                                        <li className="breadcrumb-item active">Maintenance Préventive</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Liste des maintenances préventives des composants par produit</h3>
                        </div>
                        <div className="card-body">
                            <table id="example6" className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name_equip')} style={{ cursor: 'pointer' }}>
                                            Nom de l'équipement {renderSortArrow('name_equip')}
                                        </th>
                                        <th onClick={() => handleSort('name_comp')} style={{ cursor: 'pointer' }}>
                                            Nom du composant {renderSortArrow('name_comp')}
                                        </th>
                                        <th onClick={() => handleSort('current_value')} style={{ cursor: 'pointer' }}>
                                            Valeur actuelle {renderSortArrow('current_value')}
                                        </th>
                                        <th onClick={() => handleSort('cycle')} style={{ cursor: 'pointer' }}>
                                            Cycle {renderSortArrow('cycle')}
                                        </th>
                                        <th onClick={() => handleSort('last_maint_date')} style={{ cursor: 'pointer' }}>
                                            Dernière date de maintenance {renderSortArrow('last_maint_date')}
                                        </th>
                                        <th onClick={() => handleSort('state')} style={{ cursor: 'pointer' }}>
                                            État {renderSortArrow('state')}
                                        </th>
                                    </tr>
                                    <tr>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.name_equip}
                                                onChange={(e) => handleSearchChange('name_equip', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.name_comp}
                                                onChange={(e) => handleSearchChange('name_comp', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.current_value}
                                                onChange={(e) => handleSearchChange('current_value', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.cycle}
                                                onChange={(e) => handleSearchChange('cycle', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.last_maint_date}
                                                onChange={(e) => handleSearchChange('last_maint_date', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.state}
                                                onChange={(e) => handleSearchChange('state', e.target.value)}
                                                placeholder="Rechercher..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFilteredNotifprevunique.map((notif, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.target.parentNode.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}
                                        >
                                            <td>{notif.name_equip}</td>
                                            <td>{notif.name_comp}</td>
                                            <td>{notif.current_value}</td>
                                            <td>{notif.cycle}</td>
                                            <td>{formatDate(notif.last_maint_date)}</td>
                                            <td>{notif.state}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="technicien-id" />
                <aside className="control-sidebar control-sidebar-dark">
                    {/* Control sidebar content goes here */}
                </aside>
            </div>
        </div>
    );
}

export default Maintenanceproduitcomptech;
