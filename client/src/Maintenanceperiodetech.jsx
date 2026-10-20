import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function Maintenanceperiodetech() {
    const [maintenancePrev, setMaintenancePrev] = useState([]);
    const [technicienId, setTechnicienId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchConfig, setSearchConfig] = useState({ name: '', last_maint_date: '', cycle: '', next_maint_date: '', state: '' });
    const [errors, setErrors] = useState({});

    const formatDate = (dateString) => {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        return new Date(dateString).toLocaleString('en-GB', options);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001', { withCredentials: true });
                const userRole = response.data.role;

                if (userRole === 'technician') {
                    const techResponse = await axios.get('http://localhost:3001/api/v1/technicien/techid');
                    const technicians = techResponse.data.data.technicien;

                    if (technicians.length > 0) {
                        const connectedTechnician = technicians.find(technician => technician.name === response.data.name);

                        if (connectedTechnician) {
                            const technicienId = connectedTechnician.id;
                            setTechnicienId(technicienId);
                            const notifResponse = await axios.get(`http://localhost:3001/api/v1/maintenance_prevtech/${technicienId}`);
                            const maintenancePrevData = notifResponse.data.data.maintenance_prev;
                            setMaintenancePrev(maintenancePrevData);
                            document.getElementById('technicien-id').value = technicienId; // Mettre à jour l'élément caché
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
        window.location.href = `http://localhost:5173/equipements/${id}/updateequipperiode`;
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

    const sortedFilteredMaintenancePrev = React.useMemo(() => {
        let filteredMaintenancePrev = maintenancePrev.filter(item => 
            item.name.toLowerCase().includes(searchConfig.name.toLowerCase()) &&
            formatDate(item.last_maint_date).toLowerCase().includes(searchConfig.last_maint_date.toLowerCase()) &&
            (item.cycle + ' ' + item.unit).toLowerCase().includes(searchConfig.cycle.toLowerCase()) &&
            formatDate(item.next_maint_date).toLowerCase().includes(searchConfig.next_maint_date.toLowerCase())&&
            item.state.toLowerCase().includes(searchConfig.state.toLowerCase()) 
        );

        if (sortConfig.key !== null) {
            filteredMaintenancePrev.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredMaintenancePrev;
    }, [maintenancePrev, sortConfig, searchConfig]);

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
                                    <h1></h1>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb float-sm-right">
                                        <li className="breadcrumb-item"><a href="http://localhost:5173/equipment">Equipement</a></li>
                                        <li className="breadcrumb-item active">maintenance préventive</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Liste des maintenances préventive par produit</h3>
                        </div>
                        <div className="card-body">
                            <table id="example6" className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                            Nom de l'équipement {renderSortArrow('name')}
                                        </th>
                                        <th onClick={() => handleSort('last_maint_date')} style={{ cursor: 'pointer' }}>
                                            Dernière date de maintenance {renderSortArrow('last_maint_date')}
                                        </th>
                                        <th onClick={() => handleSort('cycle')} style={{ cursor: 'pointer' }}>
                                            Cycle {renderSortArrow('cycle')}
                                        </th>
                                        <th onClick={() => handleSort('next_maint_date')} style={{ cursor: 'pointer' }}>
                                            Prochaine date de maintenance {renderSortArrow('next_maint_date')}
                                        </th>
                                        <th onClick={() => handleSort('state')} style={{ cursor: 'pointer' }}>
                                        State {renderSortArrow('state')}
                                        </th>
                                    </tr>
                                    <tr>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.name}
                                                onChange={(e) => handleSearchChange('name', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.last_maint_date}
                                                onChange={(e) => handleSearchChange('last_maint_date', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.cycle}
                                                onChange={(e) => handleSearchChange('cycle', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.next_maint_date}
                                                onChange={(e) => handleSearchChange('next_maint_date', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                        <input
                                                type="text"
                                                value={searchConfig.state}
                                                onChange={(e) => handleSearchChange('state', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFilteredMaintenancePrev.map((notif, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.target.parentNode.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}
                                        >
                                            <td>{notif.name}</td>
                                            <td>{formatDate(notif.last_maint_date)}</td>
                                            <td>{notif.cycle} {notif.unit}</td>
                                            <td>{formatDate(notif.next_maint_date)}</td>
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

export default Maintenanceperiodetech;
