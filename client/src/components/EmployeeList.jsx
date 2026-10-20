import React, { useEffect, useState, useContext } from "react";
import EmployeeFinder from '../apis/EmployeeFinder';
import { useNavigate, Link } from 'react-router-dom';
import { EmployeesContext } from '../context/EmployeesContext';
import axios from 'axios';
import './EquipementList.css';
import AddEmployee from "./AddEmployee";

const EmployeeList = () => {
  const { employees, setEmployees } = useContext(EmployeesContext);
  const navigate = useNavigate();
  const [searchTermFirstname, setSearchTermFirstname] = useState("");
  const [searchTermPost, setSearchTermPost] = useState("");
  const [searchTermDocuments, setSearchTermDocuments] = useState("");
  const [searchTermPhone, setSearchTermPhone] = useState("");
  const [searchTermRole, setSearchTermRole] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/v1/employeelist");
        setEmployees(response.data.data.employee);
        setSearchResults(response.data.data.employee);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setEmployees]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await axios.get('http://localhost:3001', { withCredentials: true });
        setIsAdmin(response.data.role === 'admin');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchTermFirstname, searchTermPost, searchTermDocuments, searchTermPhone, searchTermRole]);

  const filterResults = () => {
    const filteredResults = employees.filter(employee => {
      const firstname = employee.firstname ? employee.firstname.toLowerCase() : '';
      const post = employee.post ? employee.post.toLowerCase() : '';
      const documents = employee.documents ? employee.documents.toLowerCase() : '';
      const phone = employee.phone ? employee.phone.toLowerCase() : '';
      const role = employee.role ? employee.role.toLowerCase() : '';

      return (
        firstname.includes(searchTermFirstname.toLowerCase()) &&
        post.includes(searchTermPost.toLowerCase()) &&
        documents.includes(searchTermDocuments.toLowerCase()) &&
        phone.includes(searchTermPhone.toLowerCase()) &&
        role.includes(searchTermRole.toLowerCase())
      );
    });
    setSearchResults(filteredResults);
  };

  const handleSearchFirstnameChange = (e) => setSearchTermFirstname(e.target.value);
  const handleSearchPostChange = (e) => setSearchTermPost(e.target.value);
  const handleSearchDocumentsChange = (e) => setSearchTermDocuments(e.target.value);
  const handleSearchPhoneChange = (e) => setSearchTermPhone(e.target.value);
  const handleSearchRoleChange = (e) => setSearchTermRole(e.target.value);

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    navigate(`/employees/${id}/update`);
  };

  const handleDelete = async (id) => {
    try {
      const confirmMessage = "Cette employée a d'autres relations. Pour la supprimer, vous devez d'abord supprimer toutes ses relations.?";
      const confirmDelete = window.confirm(confirmMessage);
      if (!confirmDelete) return;

      await EmployeeFinder.delete(`/${id}`);
      setEmployees(employees.filter((employee) => employee.id !== id));
      setSearchResults(searchResults.filter((employee) => employee.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleAddEmployee = () => {
    setShowAddEmployee(!showAddEmployee);
  };

  return (
    <div className="content-wrapper">
      <div className="table-responsive">
        <div className="table-wrapper">
          <div className="table-title">
            <div className="row">
              <div className="col-sm-6">
              <h6>
  <Link to="/dash" style={{ fontWeight: 'bold' ,color:'#17a2b8'}}>Aceuil</Link>
  <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: '#666' }}></i>
  <Link to="" style={{ fontWeight: 'bold',color:'#17a2b8' }}>Liste des Employees</Link>
</h6>

              </div>
              <div className="col-sm-6 text-center">
                <button className="btn btn-info" onClick={toggleAddEmployee}>
                  <i className="fa fa-user-plus"></i>
                </button>
                {showAddEmployee && (
                  <div className="popup-container">
                    <div className="popup">
                      <AddEmployee hideAddEmployee={toggleAddEmployee} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row mb-2">
            <div className="col">
              <div className="table-responsive">
                <table className="table table-striped custom-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Poste</th>
                      <th>Documents</th>
                      <th>Téléphone</th>
                      <th>Rôle</th>
                      <th>Modifier</th>
                      <th>Supprimer</th>
                    </tr>
                    <tr>
                      <th><input   className="search-input"  type="text" placeholder="Search Nom" value={searchTermFirstname} onChange={handleSearchFirstnameChange} />  <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                      </th>
                      <th><input   className="search-input"  type="text" placeholder="Search Poste" value={searchTermPost} onChange={handleSearchPostChange} />
                      <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                      </th>
                      <th><input   className="search-input"  type="text" placeholder="Search Documents" value={searchTermDocuments} onChange={handleSearchDocumentsChange} />
                      <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                      </th>
                      <th><input   className="search-input"  type="text" placeholder="Search Téléphone" value={searchTermPhone} onChange={handleSearchPhoneChange} />
                      <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                      </th>
                      <th><input   className="search-input"  type="text" placeholder="Search Rôle" value={searchTermRole} onChange={handleSearchRoleChange} />
                      <i className="fas fa-filter" style={{ marginLeft: '5px', color: '#666', cursor: 'pointer' }}></i>
                      </th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.firstname}</td>
                        <td>{employee.post}</td>
                        <td>
                          {employee.documents === null || employee.documents === "" || employee.documents === "null" ? (
                            <span>No Document</span>
                          ) : (
                            <a href={`http://localhost:3001/${employee.documents}`} target="_blank" rel="noopener noreferrer">
                              <i className="far fa-file"></i>
                            </a>
                          )}
                        </td>
                        <td>{employee.phone}</td>
                        <td>{employee.role}</td>
                        <td>
                          <button onClick={(e) => handleUpdate(e, employee.id)} className="btn btn-outline-secondary">
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(employee.id)} className="btn btn-outline-danger">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <nav>
                  <ul className="pagination">
                    {Array.from({ length: Math.ceil(searchResults.length / itemsPerPage) }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="hint-text">
                  Showing {Math.min(indexOfLastItem, searchResults.length)} of {searchResults.length} entries
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
