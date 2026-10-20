import React, { useEffect, useState, useContext } from "react";
import Prop_equipFinder from '../apis/Prop_equipFinder';
import { useNavigate } from 'react-router-dom';
import { Prop_equipsContext } from '../context/Prop_equipsContext';

const Prop_equipList = () => {
  const { prop_equips, setProp_equips } = useContext(Prop_equipsContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Prop_equipFinder.get("/");
        setProp_equips(response.data.data.prop_equip);
        setSearchResults(response.data.data.prop_equip);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setProp_equips]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/prop_equips/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await Prop_equipFinder.delete(`/${id}`);
      setProp_equips(prop_equips.filter((prop_equip) => prop_equip.id !== id));
      setSearchResults(searchResults.filter((prop_equip) => prop_equip.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterResults(e.target.value);
  };

  const filterResults = (term) => {
    setSearchResults(
      prop_equips.filter(
        (prop_equip) =>
          prop_equip.description.toLowerCase().includes(term.toLowerCase()) ||
          prop_equip.equipement_name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Search by name or location"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <div className="table-responsive">
            <table className="table equipement-table">
              <thead>
                <tr className="bg-info">
                <th>Valeur actuelle</th>
<th>Cycle</th>
<th>Dernière valeur de maintenance</th>
<th>Date de dernière maintenance</th>
<th>Description</th>
<th>Équipement</th>
<th>Propriété de fonction</th>
<th>Modifier</th>
<th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(prop_equip => (
                  <tr key={prop_equip.id}>
                    <td>{prop_equip.current_value}</td>
                    <td>{prop_equip.cycle}</td>
                    <td>{prop_equip.last_maint_value}</td>
                    <td>{formatDate(prop_equip.last_maint_date)}</td>
                    <td>{prop_equip.description}</td>
                    <td>{prop_equip.equipement_name}</td>
                    <td>{prop_equip.prop_function_name}</td>
                    <td>
                      <button onClick={(e) => handleUpdate(e, prop_equip.id)} className="btn btn-warning">
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(prop_equip.id)} className="btn btn-danger"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table> 
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Prop_equipList;
