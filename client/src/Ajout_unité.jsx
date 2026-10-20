import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Ajoutunit.css';

function Ajout_unité() {
    const [units, setUnits] = useState([]);
    const [unit, setUnit] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUnitList();
    }, []);

    const fetchUnitList = async () => {
        try {
            const unitsResponse = await axios.get("/backend/api/v1/unit");
            setUnits(unitsResponse.data.data.unit);
        } catch (error) {
            console.error('Error fetching unit list:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/backend/api/v1/unit", {
               unit: unit // corrected the object key
            });
            addUnit(response.data.data.unit);
            clearForm();
            setRefresh(true);
        } catch (err) {
            console.log(err);
        }
    };

    const addUnit = (newUnit) => {
        setUnits([...units, newUnit]);
    };

    const clearForm = () => {
        setUnit('');
    };

    const filteredUnits = units.filter(unit =>
        unit.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="content-wrapper">
            <div className="container-xl">
                <div className="center-content">
                    <h4>Ajouter une unité</h4>
                    <div className="cardajout">
                        <div className="card-header">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search unit"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="cardajout-body">
                            {filteredUnits.map((unit, index) => (
                                <div key={index}>
                                    <p>{unit.unit}</p>
                                    <hr /> {/* Add a line after each unit */}
                                </div>
                            ))}
                        </div>
                    </div>
                    <br></br>
                    <form onSubmit={handleSubmit}>
                        <div className="cardajout">
                            <div className="cardajout-body">
                                <div className="form-group">
                                    <label>Ajouter une unité</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">ADD</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Ajout_unité;
