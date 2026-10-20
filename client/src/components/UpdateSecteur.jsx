import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SecteursContext } from "../context/SecteursContext";
import SecteurFinder from "../apis/SecteurFinder";

const UpdateSecteur = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { secteurs } = useContext(SecteursContext);
  const [ref, setRef] = useState("");
  const [lib, setLib] = useState("");
  const [description, setDescription] = useState("");
  const [refError, setRefError] = useState("");
  const [libError, setLibError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await SecteurFinder.get(`/${id}`);
        const secteurData = response.data.data.secteur;
        setRef(secteurData.ref);
        setLib(secteurData.lib);
        setDescription(secteurData.description);
      } catch (error) {
        console.error("Error fetching secteur:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setRefError("");
    setLibError("");

    // Validate fields
    if (!ref.trim()) {
      setRefError("La référence est obligatoire.");
      return;
    }
    if (!lib.trim()) {
      setLibError("Le libellé est obligatoire.");
      return;
    }

    try {
      await SecteurFinder.put(`/${id}`, {
        ref,
        lib,
        description,
      });
      navigate('/secteur');
    } catch (error) {
      console.error("Error updating secteur:", error);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="card">
          <div className="card-header">
            <button onClick={() => navigate('/secteur')} className="btn btn-sm btn-danger float-right">Fermer</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
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
                    {refError && <div className="text-danger">{refError}</div>}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="lib">Libellé</label>
                    <input
                      value={lib}
                      onChange={(e) => setLib(e.target.value)}
                      id="lib"
                      className="form-control"
                      type="text"
                    />
                    {libError && <div className="text-danger">{libError}</div>}
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
              </div>
              
              <button
                type="submit"
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

export default UpdateSecteur;
