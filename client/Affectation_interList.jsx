import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { Affectation_intersContext } from '../context/Affectation_intersContext';
import Affectation_interFinder from '../apis/Affectation_interFinder';

const AffectationInterList = () => {
  const { affectation_inters, setAffectation_inters } = useContext(Affectation_intersContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await Affectation_interFinder.get("/");
        setAffectation_inters(response.data.data.affectation_inter);
        setSearchResults(response.data.data.affectation_inter);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setAffectation_inters]);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/affectation_inters/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      await Affectation_interFinder.delete(`/${id}`);
      setAffectation_inters(affectation_inters.filter((affectation_inter) => affectation_inter.id !== id));
      setSearchResults(searchResults.filter((affectation_inter) => affectation_inter.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterResults(e.target.value);
  };

  const filterResults = (term) => {
    setSearchResults(
        affectation_inters.filter(
        (affectation_inter) =>
        affectation_inter.technicien_name.toLowerCase().includes(term.toLowerCase()) ||
        affectation_inter.intervention_name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <div className="affectation_inter-list-container">
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Search by technicien or intervention"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <table className="table affectation_inter-table">
        <thead>
          <tr className="bg-info">
            <th>Duration</th>
            <th>Report</th>
            <th>Technicien</th>
            <th>Intervention</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
        {searchResults.map(affectation_inter => (
            <tr key={affectation_inter.id}>
              <td>{affectation_inter.duration}</td>
              <td>{affectation_inter.report}</td>
              <td>{affectation_inter.technicien_name}</td>
              <td>{affectation_inter.intervention_name}</td>
              <td>
                <button onClick={(e) => handleUpdate(e, affectation_inter.id)} className="btn btn-warning">Update</button>
              </td>
              <td>
                <button onClick={() => handleDelete(affectation_inter.id)} className="btn btn-danger">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AffectationInterList;
