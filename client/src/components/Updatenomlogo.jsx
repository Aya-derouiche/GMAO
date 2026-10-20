import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { mediaUrl } from '../utils/mediaUrl';

const Updatenomlogo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({
    name: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/backend/api/v1/nomlogo/1`);
        const nomlogoData = response.data.data.nomlogo;
        if (nomlogoData) {
          setName(nomlogoData.name || "");
          setImagePreview(nomlogoData.image ? mediaUrl(nomlogoData.image) : "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!name.trim()) {
      validationErrors.name = "Le nom est obligatoire";
    } else if (name.trim().length < 4) {
      validationErrors.name = "Le nom doit comporter au moins 4 caractères";
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", image);

      await axios.put(`/backend/api/v1/nomlogo/1`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate('/dash');
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper} className="content-wrapper">
        <div className="content-header">
          <div style={styles.card} className="card">
            <div className="card-header">
            <h1>Entrer le libellé et le logo de votre entreprise</h1>
              <button onClick={() => navigate('/dash')} className="btn btn-sm btn-danger float-right">Fermer</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="name">Libellé de l'industrie</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        id="name"
                        className={`form-control ${errors.name && 'is-invalid'}`}
                        type="text"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="image">Image</label>
                      <input
                        id="image"
                        className="form-control-file"
                        type="file"
                        onChange={handleImageChange}
                        accept=".jpg, .png"
                      />
                    </div>
                    <div className="form-group">
                      {imagePreview && (
                        <img src={imagePreview} alt="Logo actuel" style={{ maxWidth: "100px" }} />
                      )}
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
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '800px',
  },
  card: {
    width: '100%',
    padding: '20px',
  },
};

export default Updatenomlogo;
