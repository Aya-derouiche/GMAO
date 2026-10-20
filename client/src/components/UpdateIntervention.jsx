import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InterventionFinder from "../apis/InterventionFinder";
import { useNavigate } from 'react-router-dom';
    
const UpdateIntervention = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ref, setRef] = useState("");
    const [requestDate, setRequestDate] = useState("");
    const [hourNbr, setHourNbr] = useState("");
    const [typeInter, setTypeInter] = useState("");
    const [costInter, setCostInter] = useState("");
    const [beginDateHour, setBeginDateHour] = useState("");
    const [description, setDescription] = useState("");
    const [report, setReport] = useState("");
    const [component_id, setComponent_id] = useState("");
    const [components, setComponents] = useState([]);
    const [equipement_id, setEquipement_id] = useState("");
    const [equipments, setEquipments] = useState([]);
    const [reclamation_id, setReclamation_id] = useState("");
    const [reclamations, setReclamations] = useState([]);
    const [technicien_id, setTechnicien_id] = useState("");
    const [techniciens, setTechniciens] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await InterventionFinder.get(`/${id}`);
                const interventionData = response.data.data.intervention;
                setRef(interventionData.ref);
                setRequestDate(interventionData.request_date.split('T')[0]); // Format the date
                setHourNbr(interventionData.hour_nbr);
                setTypeInter(interventionData.type_inter);
                setCostInter(interventionData.cost_inter);
    
                // Format beginDateHour
                const beginDate = new Date(interventionData.begin_date_hour);
                const offset = beginDate.getTimezoneOffset(); // Get timezone offset in minutes
                beginDate.setMinutes(beginDate.getMinutes() - offset); // Adjust the date by the offset
                const formattedDate = beginDate.toISOString().slice(0, 16);
                setBeginDateHour(formattedDate);
    
                setDescription(interventionData.description);
                setReport(interventionData.report);
                setComponent_id(interventionData.component_id);
                setEquipement_id(interventionData.equipement_id);
                setReclamation_id(interventionData.reclamation_id);
                setTechnicien_id(interventionData.technicien_id);
    
                const equipmentsResponse = await InterventionFinder.get("/");
                setEquipments(equipmentsResponse.data.data.equipments);
    
                const componentsResponse = await InterventionFinder.get("/");
                setComponents(componentsResponse.data.data.components);
    
                const reclamationsResponse = await InterventionFinder.get("/");
                setReclamations(reclamationsResponse.data.data.reclamations);
    
                const techniciensResponse = await InterventionFinder.get("/");
                setTechniciens(techniciensResponse.data.data.techniciens);
            } catch (error) {
                console.error("Error fetching intervention:", error);
            }
        };
    
        fetchData();
    }, [id]);
    
    const handleCancel = () => {
        navigate('/intervention');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await InterventionFinder.put(`/${id}`, {
                ref,
                request_date: requestDate,
                hour_nbr: hourNbr,
                type_inter: typeInter,
                cost_inter: costInter,
                begin_date_hour: beginDateHour,
                description: description,
                report: report,
                equipement_id: equipement_id,
                reclamation_id: reclamation_id,
                component_id: component_id,
                technicien_id: technicien_id
            });
            navigate('/intervention'); // Redirect to the interventions page after updating
        } catch (error) {
            console.error("Error updating intervention:", error);
        }
    };

    return (
        <div className="content-wrapper">
          <div className="content-header">
            <div className="card">
              <div className="card-header">
                <button onClick={() => navigate('/intervention')} className="btn btn-sm btn-danger float-right">Fermer</button>
              </div>
              <div className="card-body">
                <form>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="ref">Référence</label>
                        <input
                          value={ref}
                          onChange={(e) => setRef(e.target.value)}
                          id="ref"
                          className="form-control"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="requestDate">Date de demande</label>
                        <input
                          value={requestDate}
                          onChange={(e) => setRequestDate(e.target.value)}
                          id="requestDate"
                          className="form-control"
                          type="date"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="hourNbr">Numéro d'heure</label>
                        <input
                          value={hourNbr}
                          onChange={(e) => setHourNbr(e.target.value)}
                          id="hourNbr"
                          className="form-control"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="typeInter">Type</label>
                        <input
                          value={typeInter}
                          onChange={(e) => setTypeInter(e.target.value)}
                          id="typeInter"
                          className="form-control"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="costInter">Coût</label>
                        <input
                          value={costInter}
                          onChange={(e) => setCostInter(e.target.value)}
                          id="costInter"
                          className="form-control"
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="beginDateHour">Date et heure de début</label>
                        <input
                          value={beginDateHour}
                          onChange={(e) => setBeginDateHour(e.target.value)}
                          id="beginDateHour"
                          className="form-control"
                          type="datetime-local"
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
                        <label htmlFor="report">Rapport</label>
                        <input
                          value={report}
                          onChange={(e) => setReport(e.target.value)}
                          id="report"
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
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="reclamation_id">Réclamation</label>
                        <select
                          value={reclamation_id}
                          onChange={(e) => setReclamation_id(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Sélectionner une réclamation</option>
                          {reclamations.map(reclamation => (
                            <option key={reclamation.id} value={reclamation.id}>
                              {reclamation.ref}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="technicien_id">Technicien</label>
                        <select
                          value={technicien_id}
                          onChange={(e) => setTechnicien_id(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Sélectionner un technicien</option>
                          {techniciens.map(technicien => (
                            <option key={technicien.id} value={technicien.id}>
                              {technicien.name}
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
                  <button type="button" onClick={handleCancel} className="btn btn-secondary">Annuler</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      );
      };
      

export default UpdateIntervention;
