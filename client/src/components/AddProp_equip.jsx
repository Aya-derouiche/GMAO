import React, { useState, useContext, useEffect } from "react";
import Prop_equipFinder from '../apis/Prop_equipFinder';
import { Prop_equipsContext } from '../context/Prop_equipsContext'; 

const AddProp_equip = ({ hideAddEquipement }) => {
    const { addProp_equip } = useContext(Prop_equipsContext);
    const [current_value, setCurrent_value] = useState("");
    const [cycle, setCycle] = useState("");
    const [last_maint_value, setLast_maint_value] = useState("");
    const [last_maint_date, setLast_maint_date] = useState("");
    const [description, setDescription] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [prop_function_id, setProp_function_id] = useState("");
    const [prop_functions, setProp_functions] = useState([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        if (refresh) {
            // Reload the page after adding an equipment
            window.location.reload();
            // Reset the refresh state to prevent continuous refresh
            setRefresh(false);
        }
    }, [refresh]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Prop_equipFinder.get("/");
                setEquipments(response.data.data.equipments); 
                setProp_functions(response.data.data.prop_functions);
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await Prop_equipFinder.post("/", {
                current_value,
                cycle,
                last_maint_value,
                last_maint_date,
                description,
                equipement_id,
                prop_function_id
            });
            addProp_equip(response.data.data.prop_equip);
            clearForm();
            setRefresh(true);
        } catch (err) {
            console.log(err);
        }
    };
  
    const clearForm = () => {
        setCurrent_value("");
        setCycle("");
        setLast_maint_value("");
        setLast_maint_date("");
        setDescription("");
        setEquipement_id("");
        setProp_function_id("");
    };

    return (
        <div className="card">
            <div className="card-body">
                <button onClick={hideAddEquipement} className="close-button">
                    <i className="fas fa-times"></i>
                </button>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Valeur actuelle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={current_value}
                                    onChange={(e) => setCurrent_value(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Cycle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={cycle}
                                    onChange={(e) => setCycle(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Dernier valeur de la maintenance</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={last_maint_value}
                                    onChange={(e) => setLast_maint_value(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Dernier Date de la maintenance</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={last_maint_date}
                                    onChange={(e) => setLast_maint_date(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>Machine</label>
                                <select
                                    value={equipement_id}
                                    onChange={(e) => setEquipement_id(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Select Machine</option>
                                    {equipments.map(equipment => (
                                        <option key={equipment.id} value={equipment.id}>
                                            {equipment.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label>propriété de fonction</label>
                                <select
                                    value={prop_function_id}
                                    onChange={(e) => setProp_function_id(e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">propriété de fonction</option>
                                    {prop_functions.map(prop_function => (
                                        <option key={prop_function.id} value={prop_function.id}>
                                            {prop_function.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">ADD</button>
                </form>
            </div>
        </div>
    );
};

export default AddProp_equip;
