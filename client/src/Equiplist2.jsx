import React from "react";

function Equiplist2() {
 

  return (
   
        <div>
          <div>
      <div className="wrapper">
        {/* Content Wrapper. Contains page content */}
        <div className="content-wrapper">
          {/* Content Header (Page header) */}
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1></h1>
                </div>
                <div className="col-sm-6">
                  <ol className="breadcrumb float-sm-right">
                    <li className="breadcrumb-item"><a href="http://localhost:5173/equipment">Equipement</a></li>
                    <li className="breadcrumb-item active">maintenance préventive</li>
                  </ol>
                </div>
              </div>
            </div>{/* /.container-fluid */}
          </section>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Liste des equipements </h3>
            </div>
            {/* /.card-header */}
            <div className="card-body">
            <table id="example4" className="table table-bordered table-striped">
  <thead>
    <tr>
    <th>Équipement</th>
                
              
             
    <th>Modèle</th>
                  <th>Numéro de série</th>
                <th>Date d'expiration de la garantie</th>
            
             
              
             
              </tr>
  </thead>
  <tbody></tbody> {/* Leave tbody empty */}
  <tfoot>
    <tr>
              <th>Équipement</th>
                <th>Statut</th>
                <th>Date d'ajout</th>
                <th>Date d'expiration de la garantie</th>
            
              
    </tr>
  </tfoot>
</table>
            </div>
            {/* /.card-body */}
          </div>
          {/* /.card */}
        </div>
        {/* /.col */}
      </div>
      {/* /.row */}
      {/* /.container-fluid */}
      {/* /.content */}
      {/* /.content-wrapper */}
      {/* Control Sidebar */}
      <aside className="control-sidebar control-sidebar-dark">
        {/* Control sidebar content goes here */}
      </aside>
      {/* /.control-sidebar */}
      {/* ./wrapper */}
    </div>
    
        </div>
      )
    }
export default Equiplist2
