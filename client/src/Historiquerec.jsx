import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowUp, FaArrowDown, FaPrint } from 'react-icons/fa';

function Historiquerec() {
    const [reclamations, setReclamations] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchConfig, setSearchConfig] = useState({
        equipment_name: '',
        created_by: '',
        priority: '',
        responsible_name: '',
        technicien_name: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/v1/historiquerec');
                setReclamations(response.data.data.reclamations);
            } catch (error) {
                console.error('Error retrieving data:', error);
            }
        };

        fetchData();
    }, []);

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

    const sortedFilteredReclamations = React.useMemo(() => {
        let filteredReclamations = reclamations.filter(item =>
            item.equipment_name.toLowerCase().includes(searchConfig.equipment_name.toLowerCase()) &&
            item.created_by.toLowerCase().includes(searchConfig.created_by.toLowerCase()) &&
            item.priority.toLowerCase().includes(searchConfig.priority.toLowerCase()) &&
            (item.technicien_name ? item.technicien_name.toLowerCase().includes(searchConfig.technicien_name.toLowerCase()) : true)
        );

        if (sortConfig.key !== null) {
            filteredReclamations.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredReclamations;
    }, [reclamations, sortConfig, searchConfig]);

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
                                    <h1>Historique des Réclamations</h1>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb float-sm-right">
                                        <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                                        <li className="breadcrumb-item active">Historique Réclamations</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Historique des Réclamations par employee</h3>
                            <FaPrint
                                onClick={handlePrint}
                                style={{ float: 'right', cursor: 'pointer' }}
                                className="no-print"
                                size={24}
                                title="Print"
                            />
                        </div>
                        <div className="card-body">
                            <table className="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('equipment_name')} style={{ cursor: 'pointer' }}>
                                            Nom de l'équipement {renderSortArrow('equipment_name')}
                                        </th>
                                        <th onClick={() => handleSort('created_by')} style={{ cursor: 'pointer' }}>
                                            Créé par {renderSortArrow('created_by')}
                                        </th>
                                        <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                                            Priorité {renderSortArrow('priority')}
                                        </th>
                                        <th onClick={() => handleSort('responsible_name')} style={{ cursor: 'pointer' }}>
                                            Responsable {renderSortArrow('responsible_name')}
                                        </th>
                                        <th onClick={() => handleSort('technicien_name')} style={{ cursor: 'pointer' }}>
                                            Technicien {renderSortArrow('technicien_name')}
                                        </th>
                                    </tr>
                                    <tr className="no-print">
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.equipment_name}
                                                onChange={(e) => handleSearchChange('equipment_name', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.created_by}
                                                onChange={(e) => handleSearchChange('created_by', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.priority}
                                                onChange={(e) => handleSearchChange('priority', e.target.value)}
                                                placeholder="Search..."
                                                style={{ width: '100%' }}
                                            />
                                        </th>
                                        <th>
                                            <input
                                                type="text"
                                                value={searchConfig.responsible_name}
                                                onChange={(e) => handleSearchChange('responsible_name', e.target.value)}
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
                                    {sortedFilteredReclamations.map((reclamation, index) => (
                                        <tr key={index}>
                                            <td>{reclamation.equipment_name}</td>
                                            <td>{reclamation.created_by}</td>
                                            <td>{reclamation.priority}</td>
                                            <td>{reclamation.responsible_name}</td>
                                            <td>{reclamation.technicien_name || 'N/A'}</td>
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

export default Historiquerec;
