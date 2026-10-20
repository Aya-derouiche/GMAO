import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Prop_functionFinder from "../apis/Prop_functionFinder";

const UpdatePropFunction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [component_id, setComponent_id] = useState("");
  const [components, setComponents] = useState([]);
  const [equipement_id, setEquipement_id] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Prop_functionFinder.get("/");
        setEquipments(response.data.data.equipments);
        setComponents(response.data.data.components);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Prop_functionFinder.get(`/${id}`);
        const prop_functionData = response.data.data.prop_function;
        setName(prop_functionData.name);
        setType(prop_functionData.type);
        setUnit(prop_functionData.unit);
        setComponent_id(prop_functionData.component_id);
        setEquipement_id(prop_functionData.equipement_id);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!name.trim()) {
      errors.name = "Nom obligatoire";
    }

    if (!type.trim()) {
      errors.type = "Type obligatoire";
    }

    if (!unit.trim()) {
      errors.unit = "Unité obligatoire";
    }

    if (!component_id) {
      errors.component_id = "Composant obligatoire";
    }

    if (!equipement_id) {
      errors.equipement_id = "Équipement obligatoire";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      await Prop_functionFinder.put(`/${id}`, {
        name,
        type,
        unit,
        component_id,
        equipement_id
      });
      navigate('/prop_function');
    } catch (error) {
      console.error("Error updating prop function:", error);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="card">
          <div className="card-header">
            <button onClick={() => navigate('/prop_function')} className="btn btn-sm btn-danger float-right">Fermer</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="name">Nom</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      id="name"
                      className={`form-control ${errors.name && 'is-invalid'}`}
                      type="text"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <input
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      id="type"
                      className={`form-control ${errors.type && 'is-invalid'}`}
                      type="text"
                    />
                    {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="unit">Unité</label>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      id="unit"
                      className={`form-control ${errors.unit && 'is-invalid'}`}
                      type="text"
                    />
                    {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="equipement_id">Équipement</label>
                    <select
                      value={equipement_id}
                      onChange={(e) => setEquipement_id(e.target.value)}
                      className={`form-control ${errors.equipement_id && 'is-invalid'}`}
                    >
                      <option value="">Sélectionner un équipement</option>
                      {equipments.map(equipment => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.name}
                        </option>
                      ))}
                    </select>
                    {errors.equipement_id && <div className="invalid-feedback">{errors.equipement_id}</div>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="component_id">Composant</label>
                    <select
                      value={component_id}
                      onChange={(e) => setComponent_id(e.target.value)}
                      className={`form-control ${errors.component_id && 'is-invalid'}`}
                    >
                      <option value="">Sélectionner un composant</option>
                      {components.map(component => (
                        <option key={component.id} value={component.id}>
                          {component.name}
                        </option>
                      ))}
                    </select>
                    {errors.component_id && <div className="invalid-feedback">{errors.component_id}</div>}
                  </div>
                </div>
                <div className="col-md-12">
                  <button type="submit" className="btn btn-primary">Soumettre</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
  
export default UpdatePropFunction;
