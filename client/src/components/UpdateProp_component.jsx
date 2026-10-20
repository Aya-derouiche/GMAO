import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Prop_componentFinder from "../apis/Prop_componentFinder";

const UpdateProp_component = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [current_value, setCurrent_value] = useState("");
    const [cycle, setCycle] = useState("");
    const [last_maint_value, setLast_maint_value] = useState("");
    const [last_maint_date, setLast_maint_date] = useState(new Date());
    const [description, setDescription] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [components, setComponents] = useState([]);
    const [prop_function_id, setProp_function_id] = useState("");
    const [prop_functions, setProp_functions] = useState([]);
  
    useEffect(() => { 
        const fetchData = async () => {
            try {
                const response = await Prop_componentFinder.get("/"); // Fetch data from backend
                setComponents(response.data.data.components); 
                setProp_functions(response.data.data.prop_functions);// Update equipments state
            } catch (err) {
                console.log(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await Prop_componentFinder.get(`/${id}`);
            const prop_componentData = response.data.data.prop_component;
            setCurrent_value(prop_componentData.current_value);
            setCycle(prop_componentData.cycle);
            setLast_maint_value(prop_componentData.last_maint_value);
            setLast_maint_date(new Date(prop_componentData.last_maint_date));
            setDescription(prop_componentData.description);
            setComponent_id(prop_componentData.component_id);
            setProp_function_id (prop_componentData.prop_function_id );
    
            // Fetch list of component to populate the dropdown
            const componentsResponse = await Prop_componentFinder.get("/");
            setComponents(componentsResponse.data.data.components);

            const prop_functionsResponse = await Prop_componentFinder.get("/");
            setProp_functions(prop_functionsResponse.data.data.prop_functions);

          } catch (error) {
            console.error("Error fetching secteur:", error);
          }
        };
    
        fetchData();
      }, [id]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Prop_componentFinder.put(`/${id}`, {
                current_value,
                cycle,
                last_maint_value,
                last_maint_date: last_maint_date.toISOString().split('T')[0], // Correct handling of last_maint_date
                description,
                component_id,
                prop_function_id
            });
            navigate('/prop_component'); // Redirect to the prop_component page after updating
        } catch (error) {
            console.error("Error updating prop_component:", error);
        }
    };
    
    

    return (
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="current_value">Valeur actuelle</label>
            <input
              value={current_value}
              onChange={(e) => setCurrent_value(e.target.value)}
              id="current_value"
              className="form-control"
              type="text"
            />
          </div>
    
          <div className="form-group">
            <label htmlFor="cycle">Cycle</label>
            <input
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              id="cycle"
              className="form-control"
              type="text"
            />
          </div>
    
          <div className="form-group">
            <label htmlFor="last_maint_value">Dernière valeur de maintenance</label>
            <input
              value={last_maint_value}
              onChange={(e) => setLast_maint_value(e.target.value)}
              id="last_maint_value"
              className="form-control"
              type="text"
            />
          </div>
    
          <div className="form-group">
            <label htmlFor="last_maint_date">Date de dernière maintenance</label>
            <input
              value={last_maint_date.toISOString().split('T')[0]}
              onChange={(e) => setLast_maint_date(new Date(e.target.value))}
              id="last_maint_date"
              className="form-control"
              type="date"
            />
          </div>
    
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id="description"
              className="form-control"
              type="text"
            />
          </div>
    
          <div className="form-group">
            <label htmlFor="component_id">Composant</label>
            <select
              value={component_id}
              onChange={(e) => setComponent_id(e.target.value)}
              className="form-control"
            >
              <option value="">Sélectionner un composant</option>
              {components.map(component => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>
          </div>
    
          <div className="form-group">
            <label htmlFor="prop_function_id">Fonction de propriété</label>
            <select
              value={prop_function_id}
              onChange={(e) => setProp_function_id(e.target.value)}
              className="form-control"
            >
              <option value="">Sélectionner une fonction de propriété</option>
              {prop_functions.map(prop_function => (
                <option key={prop_function.id} value={prop_function.id}>
                  {prop_function.name}
                </option>
              ))}
            </select>
          </div>
    
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
          >
            Soumettre
          </button>
        </form>
      </div>
    );
    };
    
    
    export default UpdateProp_component;
    