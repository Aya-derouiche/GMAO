import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for styling
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastContainer /> 
    <App />
  </React.StrictMode>,
);
