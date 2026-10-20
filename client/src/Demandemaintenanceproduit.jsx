import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function Demandemaintenanceproduit() {
    const [notifprevunique, setNotifprevunique] = useState([]);
    const [technicienId, setTechnicienId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchConfig, setSearchConfig] = useState({
        name: '',
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
                const response = await axios.get('http://localhost:3001', { withCredentials: true });
                const userRole = response.data.role;

                const notifResponse = await axios.get('http://localhost:3001/api/v1/notifprevunique');
                const notifprevuniqueData = notifResponse.data.data.notifprevunique;
                setNotifprevunique(notifprevuniqueData);

            } catch (error) {
                console.error('Error retrieving data:', error);
                setErrors({ fetch: 'An error occurred while fetching data.' });
            }
        };

        fetchData();
    }, []);

    const handleRowClick = (id) => {
        window.location.href = `http://localhost:5173/equipements/${id}/updateequipproduit`;
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

    const sortedFilteredNotifprevunique = React.useMemo(() => {
        let filteredNotifprevunique = notifprevunique.filter(item =>
            item.name.toLowerCase().includes(searchConfig.name.toLowerCase()) &&
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
                            <h3 className="card-title">Liste demande des maintenances préventive par produit</h3>
                        </div>
                        <div className="card-body">
                            <table id="example6" className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                            Nom de l'équipement {renderSortArrow('name')}
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
                                                value={searchConfig.current_value}
                                                onChange={(e) => handleSearchChange('current_value', e.target.value)}
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
                                                value={searchConfig.last_maint_date}
                                                onChange={(e) => handleSearchChange('last_maint_date', e.target.value)}
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
                                    {sortedFilteredNotifprevunique.map((notif) => (
                                        <tr
                                            key={notif.id}
                                            onClick={() => handleRowClick(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.target.parentNode.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}
                                        >
                                            <td>{notif.name}</td>
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
                
            </div>
        </div>
    );
}

export default Demandemaintenanceproduit;
