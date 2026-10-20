import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function MaintenancecompPeriodetable() {
    const [maintenancePrevcomp, setMaintenancePrevcomp] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchConfig, setSearchConfig] = useState({ name: '', lastMaintDate: '', cycle: '', nextMaintDate: '', state: '' });
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
                const response = await axios.get('/backend', { withCredentials: true });
                const notifResponse = await axios.get('/backend/api/v1/maintenance_prevcomp');
                const maintenancePrevData = notifResponse.data.data.maintenance_prevcomp;
                setMaintenancePrevcomp(maintenancePrevData);
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

    const sortedFilteredMaintenancePrev = React.useMemo(() => {
        let filteredMaintenancePrev = maintenancePrevcomp.filter(item => 
            (item.name ? item.name.toLowerCase() : '').includes(searchConfig.name.toLowerCase()) &&
            (item.last_maint_date ? formatDate(item.last_maint_date).toLowerCase() : '').includes(searchConfig.lastMaintDate.toLowerCase()) &&
            (`${item.cycle} ${item.unit ? item.unit : ''}`.toLowerCase()).includes(searchConfig.cycle.toLowerCase()) &&
            (item.next_maint_date ? formatDate(item.next_maint_date).toLowerCase() : '').includes(searchConfig.nextMaintDate.toLowerCase()) &&
            (item.state ? item.state.toLowerCase() : '').includes(searchConfig.state.toLowerCase())
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
    }, [maintenancePrevcomp, sortConfig, searchConfig]);

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
                                        <li className="breadcrumb-item"><a href="/dash">Acceuil</a></li>
                                        <li className="breadcrumb-item active">Maintenance Préventive</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Liste des maintenances préventives par cycle : Période</h3>
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
                                            État {renderSortArrow('state')}
                                        </th>
                                    </tr>
                                    <tr>
                                    <th>
                                            <input
                                                type="text"
                                                value={searchConfig.name_equip}
                                                onChange={(e) => handleSearchChange('name_equip', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.name_comp}
                                                onChange={(e) => handleSearchChange('name_comp', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.lastMaintDate}
                                                onChange={(e) => handleSearchChange('lastMaintDate', e.target.value)}
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
                                                value={searchConfig.nextMaintDate}
                                                onChange={(e) => handleSearchChange('nextMaintDate', e.target.value)}
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
                                    {sortedFilteredMaintenancePrev.map((notif, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                              <td>{notif.name_equip}</td>
                                              <td>{notif.name_comp}</td>
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

export default MaintenancecompPeriodetable;
