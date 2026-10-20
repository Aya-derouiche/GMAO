import React, { useState, useContext, useEffect } from "react";
import Prop_componentFinder from '../apis/Prop_componentFinder';
import { Prop_componentsContext } from '../context/Prop_componentsContext'; 

const AddProp_component = ({ hideAddEquipement }) => {
    const { addProp_component } = useContext(Prop_componentsContext);
    const [current_value, setCurrent_value] = useState("");
    const [cycle, setCycle] = useState("");
    const [last_maint_value, setLast_maint_value] = useState("");
    const [last_maint_date, setLast_maint_date] = useState("");
    const [description, setDescription] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [components, setComponents] = useState([]);
    const [prop_function_id, setProp_function_id] = useState("");
    const [prop_functions, setProp_functions] = useState([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => { 
        if (refresh) {
            // Recharge la page après avoir ajouté un composant
            window.location.reload();
            // Réinitialise le state refresh pour éviter un rafraîchissement continu
            setRefresh(false);
        }
    }, [refresh]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Prop_componentFinder.get("/"); // Récupère les données depuis le backend
                setComponents(response.data.data.components); // Met à jour le state des composants
                setProp_functions(response.data.data.prop_functions); // Met à jour le state des fonctions de propriété
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await Prop_componentFinder.post("/", {
                current_value: current_value,
                cycle: cycle,
                last_maint_value: last_maint_value,
                last_maint_date : last_maint_date,
                description: description,
                component_id: component_id,
                prop_function_id : prop_function_id
            });
            addProp_component(response.data.data.prop_component);
            clearForm();
            setRefresh(true); // Déclenche un rafraîchissement de la page après avoir ajouté l'équipement

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
        setComponent_id("");
        setProp_function_id("");
    };

    return (
        <div className="content-wrapper">
            <div className="card">
                <div className="card-body">
                    <button onClick={hideAddEquipement} className="close-button">
                        <i className="fas fa-times"></i>
                    </button>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="valeur actuelle"
                                        value={current_value}
                                        onChange={(e) => setCurrent_value(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cycle"
                                        value={cycle}
                                        onChange={(e) => setCycle(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="valeur de la dernier maintenance"
                                        value={last_maint_value}
                                        onChange={(e) => setLast_maint_value(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <input
                                        type="date"
                                        className="form-control"
                                        placeholder="Date de la dernier maintenance"
                                        value={last_maint_date}
                                        onChange={(e) => setLast_maint_date(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <select
                                        value={component_id}
                                        onChange={(e) => setComponent_id(e.target.value)}
                                        id="component"
                                        className="custom-select"
                                    >
                                        <option value="">Composant</option>
                                        {components.map(component => (
                                            <option key={component.id} value={component.id}>
                                                {component.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <select
                                        value={prop_function_id}
                                        onChange={(e) => setProp_function_id(e.target.value)}
                                        id="prop_function_id"
                                        className="custom-select"
                                    >
                                        <option value="">Proprieté  de fonction </option>
                                        {prop_functions.map(prop_function => (
                                            <option key={prop_function.id} value={prop_function.id}>
                                                {prop_function.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Ajout</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProp_component;
