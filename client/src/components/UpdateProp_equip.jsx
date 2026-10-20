import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom"; 
import { useNavigate } from 'react-router-dom';
import Prop_equipFinder from "../apis/Prop_equipFinder";

const UpdateProp_equip = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [current_value, setCurrent_value] = useState("");
    const [cycle, setCycle] = useState("");
    const [last_maint_value, setLast_maint_value] = useState("");
    const [last_maint_date, setLast_maint_date] = useState(new Date());
    const [description, setDescription] = useState("");
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [prop_function_id, setProp_function_id] = useState("");
    const [prop_functions, setProp_functions] = useState([]);
   
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await Prop_equipFinder.get("/"); // Fetch data from backend
                setEquipments(response.data.data.equipments); 
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
            const response = await Prop_equipFinder.get(`/${id}`);
            const prop_equipData = response.data.data.prop_equip;
            setCurrent_value(prop_equipData.current_value);
            setCycle(prop_equipData.cycle);
            setLast_maint_value(prop_equipData.last_maint_value);
            setLast_maint_date(new Date(prop_equipData.last_maint_date));
            setDescription(prop_equipData.description);
            setEquipement_id(prop_equipData.equipement_id);
            setProp_function_id (prop_equipData.prop_function_id );
    
            // Fetch list of equipments to populate the dropdown
            const equipmentsResponse = await Prop_equipFinder.get("/");
            setEquipments(equipmentsResponse.data.data.equipments);

            const prop_functionsResponse = await Prop_equipFinder.get("/");
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
            await Prop_equipFinder.put(`/${id}`, {
                current_value,
                cycle,
                last_maint_value,
                last_maint_date: last_maint_date.toISOString().split('T')[0], // Correct handling of last_maint_date
                description,
                equipement_id,
                prop_function_id
            });
            navigate('/prop_equip'); // Redirect to the prop_equip page after updating
        } catch (error) {
            console.error("Error updating prop_equip:", error);
        }
    };

    return (
        <div className="content-wrapper">
          <div className="content-header">
            <div className="card">
              <div className="card-header">
                <button onClick={() => navigate('/prop_equip')} className="btn btn-sm btn-danger float-right">Fermer</button>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
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
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="equipement_id">Équipement</label>
                        <select
                          value={equipement_id}
                          onChange={(e) => setEquipement_id(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Sélectionner un équipement</option>
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
                        <label htmlFor="prop_function_id">Fonction</label>
                        <select
                          value={prop_function_id}
                          onChange={(e) => setProp_function_id(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Sélectionner une fonction</option>
                          {prop_functions.map(prop_function => (
                            <option key={prop_function.id} value={prop_function.id}>
                              {prop_function.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
            </div>
          </div>
        </div>
      );
      };
      
export default UpdateProp_equip;
