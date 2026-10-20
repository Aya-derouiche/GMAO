import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown, FaPrint } from 'react-icons/fa';

function Historiquemaint() {
    const [historique, setHistorique] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchConfig, setSearchConfig] = useState({
        name: '',
        state: '',
        last_maint_date: '',
        technicien_name: '',
        equipement_last_maint_date: ''
    });

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/backend', { withCredentials: true });
                const userRole = response.data.role;

                const notifResponse = await axios.get(`/backend/api/v1/historiqueterm`);
                const historiqueData = notifResponse.data.data.historique;
                setHistorique(historiqueData);

            } catch (error) {
                console.error('Error retrieving data:', error);
            }
        };

        fetchData();
    }, []);

    const handleRowClick = (id) => {
        window.location.href = `/equipements/${id}/update`;
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

    const sortedFilteredHistorique = React.useMemo(() => {
        let filteredHistorique = historique.filter(item =>
            item.name.toLowerCase().includes(searchConfig.name.toLowerCase()) &&
            item.state.toLowerCase().includes(searchConfig.state.toLowerCase()) &&
            formatDate(item.last_maint_date).toLowerCase().includes(searchConfig.last_maint_date.toLowerCase()) &&
            item.technicien_name.toLowerCase().includes(searchConfig.technicien_name.toLowerCase()) &&
            formatDate(item.equipement_last_maint_date).toLowerCase().includes(searchConfig.equipement_last_maint_date.toLowerCase())
        );

        if (sortConfig.key !== null) {
            filteredHistorique.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle date sorting
                if (sortConfig.key === 'last_maint_date' || sortConfig.key === 'equipement_last_maint_date') {
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
        return filteredHistorique;
    }, [historique, sortConfig, searchConfig]);

    const renderSortArrow = (key) => {
        if (sortConfig.key === key) {
            return (
                <>
                    <FaArrowUp className="sort-arrow" color={sortConfig.direction === 'ascending' ? 'black' : 'lightgray'} />
                    <FaArrowDown className="sort-arrow" color={sortConfig.direction === 'descending' ? 'black' : 'lightgray'} />
                </>
            );
        }
        return (
            <>
                <FaArrowUp className="sort-arrow" color="lightgray" />
                <FaArrowDown className="sort-arrow" color="lightgray" />
            </>
        );
    };

    const columnHeaderStyle = {
        width: '20%'
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <style>
                {`
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                    .column-header {
                        width: 20%;
                    }
                    .sort-arrow {
                        margin-left: 5px;
                    }
                `}
            </style>
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
                                        <li className="breadcrumb-item"><a href="/equipment">Equipement</a></li>
                                        <li className="breadcrumb-item active">Historique maintenance</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Historique des maintenances</h3>
                            <FaPrint
                                onClick={handlePrint}
                                style={{ float: 'right', cursor: 'pointer' }}
                                className="no-print"
                                size={24}
                                title="Print"
                            />
                        </div>
                        <div className="card-body">
                            <table id="example6" className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} style={{ ...columnHeaderStyle, cursor: 'pointer' }}>
                                            Nom {renderSortArrow('name')}
                                        </th>
                                       
                                        <th onClick={() => handleSort('last_maint_date')} style={{ ...columnHeaderStyle, cursor: 'pointer' }}>
                                            Dernière date de maintenance {renderSortArrow('last_maint_date')}
                                        </th>
                                        <th onClick={() => handleSort('technicien_name')} style={{ ...columnHeaderStyle, cursor: 'pointer' }}>
                                            technicien_name {renderSortArrow('technicien_name')}
                                        </th>
                                       
                                    </tr>
                                    <tr className="no-print">
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
                                                value={searchConfig.technicien_name}
                                                onChange={(e) => handleSearchChange('technicien_name', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                      
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFilteredHistorique.map((notif, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.target.parentNode.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}
                                        >
                                            <td>{notif.name}</td>
                                         
                                            <td>{formatDate(notif.last_maint_date)}</td>
                                            <td>{notif.technicien_name}</td>
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

export default Historiquemaint;
