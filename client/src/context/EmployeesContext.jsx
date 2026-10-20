import React, { useState, createContext } from "react";

export const EmployeesContext = createContext();

export const EmployeesContextProvider = (props) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);


  const addEmployees = (employee) => {
    setEmployees([...employees, employee]);
  };
  return (
    <EmployeesContext.Provider
      value={{
        employees,
        setEmployees,
        addEmployees,
       selectedEmployee,
        setSelectedEmployee,

       
      }}
    >
      {props.children}
    </EmployeesContext.Provider>
  );
};
