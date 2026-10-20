require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(cors({
    origin: ["http://localhost:5173"], // Replace "http://example.com" with your front-end URL
    methods: ["POST", "GET"], // Put methods in quotes separated by commas
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes for equipment
app.get("/api/v1/equipement", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT equipement.*, secteur.lib AS secteur_name
            FROM equipement
            LEFT JOIN secteur ON equipement.secteur_id = secteur.id
        `);
        const secteurs = await db.query("SELECT id, lib from secteur");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                equipement: results.rows,
                secteurs: secteurs.rows
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.get("/api/v1/equipement/:id", async (req, res) => {
    try {
        const equipement = await db.query(
            "SELECT equipement.*, secteur.lib AS secteur_name " +
            "FROM equipement " +
            "LEFT JOIN secteur ON equipement.secteur_id = secteur.id " +
            "WHERE equipement.id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                equipement: equipement.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.post("/api/v1/equipement", upload.single('image'), async (req, res) => {
    try {
        // Extract the file path from the request
        const imagePath = req.file ? req.file.path : null;

        // Parse the date string received from the frontend
        const warrantyExpirationDate = new Date(req.body.warranty_expiration_date);

        const results = await db.query(
            "INSERT INTO equipement (name, location, model, serial_number, status, image, description, warranty_expiration_date, cost, secteur_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath, // Use file path here
                req.body.description,
                warrantyExpirationDate, // Use parsed date here
                req.body.cost,
                req.body.secteur_id // Add secteur_id to the parameters
            ]
        );

        res.status(201).json({
            status: "success",
            data: {
                equipement: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.put("/api/v1/equipement/:id", upload.single('image'), async (req, res) => {
    try {
        let imagePath = req.body.image; // Get the existing image path from the request body
        if (req.file) {
            imagePath = req.file.path; // If a new image is uploaded, update the image path
        }

        const results = await db.query(
            "UPDATE equipement SET name = $1, location = $2, model = $3, serial_number = $4, status = $5, image = $6, description = $7, warranty_expiration_date = $8, cost = $9 , secteur_id = $10 WHERE id = $11 RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath, // Use updated image path here
                req.body.description,
                req.body.warranty_expiration_date,
                req.body.cost,
                req.body.secteur_id,
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                equipement: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

    app.delete("/api/v1/equipement/:id",  async(req,res) => {
        try{
            const results = await db.query("delete from equipement where id = $1",[req.params.id])
            res.status(204).json({
                status:"success",
            });
    
    
        } catch{
            console.log(err)
        }
       
    })
    


// employee routes 

app.get("/api/v1/employee", async (req, res) => {
    try {
        const results = await db.query("select * from employee");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                employee: results.rows,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/employee/:id", async (req, res) => {
    try {
        const employee = await db.query(
            `SELECT * FROM employee WHERE id = $1`,
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                employee: employee.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post("/api/v1/employee", upload.single('file'), async (req, res) =>{
    try {
        // Extract the file path from the request
        const documentPath = req.file ? req.file.path : null;

        // Parse the date string received from the frontend

        const results = await db.query(
            "INSERT INTO employee (firstname, userid, post, documents, job_title, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [
                req.body.firstname,
                
                req.body.userid,
                req.body.post,
                documentPath,
                req.body.job_title,
                req.body.phone,
                req.body.email

             
            ]
        );

        res.status(201).json({
            status: "success",
            data: {
                employee: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.put("/api/v1/employee/:id", upload.single('file'),  async (req, res) =>{
        try {
            let documentPath = req.body.file; // Get the existing image path from the request body
            if (req.file) {
                documentPath = req.file.path; // If a new image is uploaded, update the image path
            }
    
        const results = await db.query(
            "UPDATE employee SET firstname = $1, userid = $2, post = $3, documents = $4, job_title = $5, phone = $6, email = $7 WHERE id = $8 RETURNING *",
            [
                req.body.firstname,
                
                req.body.userid,
                req.body.post,
                documentPath,
                req.body.job_title,
                req.body.phone,
                req.body.email,
                req.params.id
            ]
        );
        
        res.status(200).json({
            status: "success",
            data: {
                employee: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/employee/:id",  async(req,res) => {
    try{
        const results = await db.query("delete from employee where id = $1",[req.params.id])
        res.status(204).json({
            status:"success",
        });


    } catch{
        console.log(err)
    }
   
})



///////****** technicien ********/



app.get("/api/v1/technicien", async (req, res) => {
    try {
        const results = await db.query("select * from technicien");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                technicien: results.rows,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/technicien/:id", async (req, res) => {
    try {
        const technicien = await db.query(
            `SELECT * FROM technicien WHERE id = $1`,
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                technicien: technicien.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post("/api/v1/technicien", /*upload.single('file'),*/ async (req, res) =>{
    try {
        // Extract the file path from the request
      /*  const documentPath = req.file ? req.file.path : null;*/

        // Parse the date string received from the frontend

        const results = await db.query(
            "INSERT INTO technicien (name, userid, post, email) VALUES ($1, $2, $3, $4) RETURNING *",
            [
                req.body.name,
                
                req.body.userid,
                req.body.post,
                req.body.email
            ]
        );

        res.status(201).json({
            status: "success",
            data: {
                technicien: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.put("/api/v1/technicien/:id", /*upload.single('file'),*/  async (req, res) =>{
        try {
          /*  let documentPath = req.body.file; // Get the existing image path from the request body
            if (req.file) {
                documentPath = req.file.path; // If a new image is uploaded, update the image path
            }*/
    
        const results = await db.query(
            "UPDATE technicien SET name = $1, userid = $2, post = $3, email = $4 WHERE id = $5 RETURNING *",
            [
                req.body.name,
                
                req.body.userid,
                req.body.post,
               
                req.body.email,
                req.params.id
            ]
        );
        
        res.status(200).json({
            status: "success",
            data: {
                technicien: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/technicien/:id",  async(req,res) => {
    try{
        const results = await db.query("delete from technicien where id = $1",[req.params.id])
        res.status(204).json({
            status:"success",
        });


    } catch{
        console.log(err)
    }
   
})




// secteur part 

app.get("/api/v1/secteur", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT secteur.*, equipement.name AS equipement_name
            FROM secteur
            LEFT JOIN equipement ON secteur.equipement_id = equipement.id
        `);

        // Fetch equipment names and IDs for the dropdown
        const equipments = await db.query("SELECT id, name FROM equipement");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                secteurs: results.rows,
                equipments: equipments.rows // Include equipments data in the response
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/secteur/:id", async (req, res) => {
    try {
        const secteur = await db.query(
            "SELECT secteur.*, equipement.name AS equipement_name " +
            "FROM secteur " +
            "LEFT JOIN equipement ON secteur.equipement_id = equipement.id " +
            "WHERE secteur.id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                secteur: secteur.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post("/api/v1/secteur", async (req, res) => {
    try {
        const { ref, lib, description, equipement_id } = req.body;
        const results = await db.query(
            "INSERT INTO secteur (ref, lib, description, equipement_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [ref, lib, description, equipement_id]
        );
        res.status(201).json({
            status: "success",
            data: {
                secteur: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.put("/api/v1/secteur/:id", async (req, res) => {
    try {
        const { ref, lib, description, equipement_id } = req.body;
        const results = await db.query(
            "UPDATE secteur SET ref = $1, lib = $2, description = $3, equipement_id = $4 WHERE id = $5 RETURNING *",
            [ref, lib, description, equipement_id, req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                secteur: results.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.delete("/api/v1/secteur/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM secteur WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



// composant ///////////////////////////////////////////////////////////////////



app.get("/api/v1/component", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT component.*, equipement.name AS equipement_name
            FROM component
            LEFT JOIN equipement ON component.equipement_id = equipement.id
        `);
        const equipments = await db.query("SELECT id, name FROM equipement");
      
    

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                components: results.rows,
                equipments: equipments.rows 
              
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/component/:id", async (req, res) => {
    try {
        const component = await db.query(
            "SELECT * FROM component WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                component: component.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/component", async (req, res) => {
    try {
        const { name, ref, description, breakdown_date, equipement_id } = req.body;
        const results = await db.query(
            "INSERT INTO component (name, ref, description, breakdown_date, equipement_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, ref, description, breakdown_date, equipement_id]
        );
        res.status(201).json({
            status: "success",
            data: {
                component: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/component/:id", async (req, res) => {
    try {
        const { name, ref, description, breakdown_date, equipement_id } = req.body;
        const results = await db.query(
            "UPDATE component SET name = $1, ref = $2, description = $3, breakdown_date = $4, equipement_id = $5 WHERE id = $6 RETURNING *",
            [name, ref, description, breakdown_date, equipement_id, req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                component: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.delete("/api/v1/component/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM component WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



///// prop_function//////////////////////////////////


app.get("/api/v1/prop_function", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT prop_function.*,
             component.name AS component_name, 
             equipement.name AS equipement_name
            FROM 
            prop_function

            LEFT JOIN
             component ON prop_function.component_id = component.id

            LEFT JOIN 
            equipement ON prop_function.equipement_id = equipement.id

        `);
        const components = await db.query("SELECT id, name FROM component");

        const equipments = await db.query("SELECT id, name FROM equipement");

    /* const results = await db.query("select * from prop_function");*/

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                prop_function: results.rows,
                equipments: equipments.rows,
                components: components.rows
              
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/prop_function/:id", async (req, res) => {
    try {
        const prop_function = await db.query(
            "SELECT * FROM prop_function WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_function: prop_function.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/prop_function", async (req, res) => {
    try {
        const { name, type, unit, component_id, equipement_id } = req.body;
        const results = await db.query(
            "INSERT INTO prop_function (name, type, unit, component_id, equipement_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, type, unit, component_id, equipement_id]
        );
        res.status(201).json({
            status: "success",
            data: {
                prop_function: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/prop_function/:id", async (req, res) => {
    try {
        const { name, type, unit, component_id, equipement_id } = req.body;
        const results = await db.query(
            "UPDATE prop_function SET name = $1, type = $2, unit = $3, component_id = $4 , equipement_id = $5 WHERE id = $6 RETURNING *",
            [name, type, unit, component_id, equipement_id, req.params.id] // Include req.params.id here
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_function: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/prop_function/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM prop_function WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

//// propriété machine//////////////
app.get("/api/v1/prop_equip", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
                prop_equip.*, 
                equipement.name AS equipement_name, 
                prop_function.name AS prop_function_name
            FROM 
                prop_equip
            LEFT JOIN 
                equipement ON prop_equip.equipement_id = equipement.id
            LEFT JOIN 
                prop_function ON prop_equip.prop_function_id = prop_function.id
        `);

        // Fetch equipment names and IDs for the dropdown
        const equipments = await db.query("SELECT id, name FROM equipement");
        const prop_functions = await db.query("SELECT id, name FROM prop_function");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                prop_equip: results.rows,
                equipments: equipments.rows,
                prop_functions: prop_functions.rows
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/prop_equip/:id", async (req, res) => {
    try {
        const prop_equip = await db.query(
            "SELECT * FROM prop_equip WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_equip: prop_equip.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/prop_equip", async (req, res) => {
    try {
        const { current_value, cycle, last_maint_value,last_maint_date,description, equipement_id, prop_function_id } = req.body;
        const results = await db.query(
            "INSERT INTO prop_equip (current_value, cycle, last_maint_value,last_maint_date,description, equipement_id, prop_function_id ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [current_value, cycle, last_maint_value,last_maint_date,description, equipement_id, prop_function_id ]
        );
        res.status(201).json({
            status: "success",
            data: {
                prop_equip: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/prop_equip/:id", async (req, res) => {
    try {
        const {current_value, cycle, last_maint_value,last_maint_date,description, equipement_id, prop_function_id } = req.body;
        const results = await db.query(
            "UPDATE prop_equip SET current_value = $1, cycle = $2, last_maint_value = $3 ,last_maint_date = $4 ,description = $5 , equipement_id = $6 , prop_function_id = $7 WHERE id = $8 RETURNING *",
            [current_value, cycle, last_maint_value,last_maint_date,description, equipement_id, prop_function_id, req.params.id] // Include req.params.id here
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_equip: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/prop_equip/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM prop_equip WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});






///// component property ////////////////////////////////


app.get("/api/v1/prop_component", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
            prop_component.*, 
                component.name AS component_name, 
                prop_function.name AS prop_function_name
            FROM 
            prop_component
            LEFT JOIN 
                component ON prop_component.component_id = component.id
            LEFT JOIN 
                prop_function ON prop_component.prop_function_id = prop_function.id
        `);

        // Fetch component names and IDs for the dropdown
        const components = await db.query("SELECT id, name FROM component");
        const prop_functions = await db.query("SELECT id, name FROM prop_function");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                prop_component: results.rows,
                components: components.rows,
                prop_functions: prop_functions.rows
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/prop_component/:id", async (req, res) => {
    try {
        const prop_component = await db.query(
            "SELECT * FROM prop_component WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_component: prop_component.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/prop_component", async (req, res) => {
    try {
        const { current_value, cycle, last_maint_value,last_maint_date,description, component_id, prop_function_id } = req.body;
        const results = await db.query(
            "INSERT INTO prop_component (current_value, cycle, last_maint_value,last_maint_date,description, component_id, prop_function_id ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [current_value, cycle, last_maint_value,last_maint_date,description, component_id, prop_function_id ]
        );
        res.status(201).json({
            status: "success",
            data: {
                prop_component: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/prop_component/:id", async (req, res) => {
    try {
        const {current_value, cycle, last_maint_value,last_maint_date,description, component_id, prop_function_id } = req.body;
        const results = await db.query(
            "UPDATE prop_component SET current_value = $1, cycle = $2, last_maint_value = $3 ,last_maint_date = $4 ,description = $5 , component_id = $6 , prop_function_id = $7 WHERE id = $8 RETURNING *",
            [current_value, cycle, last_maint_value,last_maint_date,description, component_id, prop_function_id, req.params.id] // Include req.params.id here
        );
        res.status(200).json({
            status: "success",
            data: {
                prop_component: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/prop_component/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM prop_component WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


/////////// ************ reclamation *********/////////////



app.get("/api/v1/reclamation", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT reclamation.*, equipement.name AS equipement_name,
            employee.firstname AS responsible_name
            FROM reclamation
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            LEFT JOIN employee ON reclamation.responsible = employee.id

        `);
        const equipments = await db.query("SELECT id, name FROM equipement");
        const employees = await db.query("SELECT id, firstname FROM employee");

    

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                reclamations: results.rows,
                equipments: equipments.rows ,
                employees: employees.rows 

              
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.get("/api/v1/reclamation/:id", async (req, res) => {
    try {
        const reclamation = await db.query(
            "SELECT * FROM reclamation WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                reclamation: reclamation.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post("/api/v1/reclamation", async (req, res) => {
    try {
        const {ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description } = req.body;
        const results = await db.query(
            "INSERT INTO reclamation (ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description]
        );
        res.status(201).json({
            status: "success",
            data: {
                reclamation: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/reclamation/:id", async (req, res) => {
    try {
        const {ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description} = req.body;
        const results = await db.query(
            "UPDATE reclamation SET ref = $1, equipement_id = $2, priority = $3, state = $4, created_by = $5, responsible = $6, creation_date = $7, final_date = $8, planified_date = $9, duration = $10, description = $11 WHERE id = $12 RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                reclamation: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});





app.delete("/api/v1/reclamation/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM reclamation WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});




//////*******intervention file********** */

app.get("/api/v1/intervention", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT intervention.*, equipement.name AS equipement_name,
            component.name AS  component_name ,
            technicien.name AS  technicien_name  ,
            reclamation.ref AS reclamation_ref 
            FROM intervention
            LEFT JOIN equipement ON intervention.equipement_id = equipement.id
            LEFT JOIN component ON intervention.component_id = component.id
            LEFT JOIN technicien ON intervention.technicien_id= technicien.id
            LEFT JOIN reclamation ON intervention.reclamation_id= reclamation.id
        `);
        const equipments = await db.query("SELECT id, name FROM equipement");
        const components = await db.query("SELECT id, name FROM component");
        const techniciens = await db.query("SELECT id, name FROM technicien");
        const reclamations = await db.query("SELECT id, ref FROM reclamation");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                interventions: results.rows,
                equipments: equipments.rows,
                components: components.rows,
                techniciens: techniciens.rows,
                reclamations: reclamations.rows

            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.get("/api/v1/intervention/:id", async (req, res) => {
    try {
        const intervention = await db.query(
            "SELECT * FROM intervention WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                intervention: intervention.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post("/api/v1/intervention", async (req, res) => {
    try {
        const {ref, request_num, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id } = req.body;
        const results = await db.query(
            "INSERT INTO intervention (ref, request_num, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
            [ref, request_num, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id]
        );
        res.status(201).json({
            status: "success",
            data: {
                intervention: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/intervention/:id", async (req, res) => {
    try {
        const {ref, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id } = req.body;
        const results = await db.query(
            "UPDATE intervention SET ref = $1, request_date = $2, hour_nbr = $3, type_inter = $4, cost_inter = $5, begin_date_hour = $6, description = $7, report = $8, equipement_id = $9, reclamation_id = $10, component_id = $11, technicien_id = $12 WHERE id = $13 RETURNING *",
            [ref, request_date, hour_nbr, type_inter, cost_inter, begin_date_hour, description, report, equipement_id, reclamation_id, component_id, technicien_id , req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                intervention: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});





app.delete("/api/v1/intervention/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM intervention WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});




///// Affectation_inter ////////////////////////////////


app.get("/api/v1/affectation_inter", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
            affectation_inter.*, 
                technicien.name AS technicien_name, 
                intervention.ref AS intervention_name
            FROM 
            affectation_inter
            LEFT JOIN 
                technicien ON affectation_inter.technicien_id = technicien.id
            LEFT JOIN 
                intervention ON affectation_inter.intervention_id = intervention.id
        `);

        // Fetch component names and IDs for the dropdown
        const techniciens = await db.query("SELECT id, name FROM technicien");
        const interventions = await db.query("SELECT id, ref FROM intervention");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                affectation_inter: results.rows,
                techniciens: techniciens.rows,
                interventions: interventions.rows
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/affectation_inter/:id", async (req, res) => {
    try {
        const affectation_inter = await db.query(
            "SELECT * FROM affectation_inter WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                affectation_inter: affectation_inter.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/affectation_inter", async (req, res) => {
    try {
        const {duration,report, technicien_id, intervention_id } = req.body;
        const results = await db.query(
            "INSERT INTO affectation_inter (duration,report, technicien_id, intervention_id  ) VALUES ($1, $2, $3, $4) RETURNING *",
            [duration,report, technicien_id, intervention_id ]
        );
        res.status(201).json({
            status: "success",
            data: {
                affectation_inter: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/affectation_inter/:id", async (req, res) => {
    try {
        const {duration,report, technicien_id, intervention_id } = req.body;
        const results = await db.query(
            "UPDATE affectation_inter SET duration = $1, report = $2, technicien_id = $3 ,intervention_id = $4 WHERE id = $5 RETURNING *",
            [duration,report, technicien_id, intervention_id, req.params.id] // Include req.params.id here
        );
        res.status(200).json({
            status: "success",
            data: {
                affectation_inter: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/affectation_inter/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM affectation_inter WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


/////////****** component Inter */



app.get("/api/v1/component_inter", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
            component_inter.*, 
                component.name AS component_name, 
                intervention.ref AS intervention_name
            FROM 
            component_inter
            LEFT JOIN 
                component ON component_inter.component_id = component.id
            LEFT JOIN 
                intervention ON component_inter.intervention_id = intervention.id
        `);

        // Fetch component names and IDs for the dropdown
        const components = await db.query("SELECT id, name FROM component");
        const interventions = await db.query("SELECT id, ref FROM intervention");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                component_inter: results.rows,
                components: components.rows,
                interventions: interventions.rows
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/component_inter/:id", async (req, res) => {
    try {
        const component_inter = await db.query(
            "SELECT * FROM component_inter WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                component_inter: component_inter.rows[0],
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.post("/api/v1/component_inter", async (req, res) => {
    try {
        const {repair_change,last_values, component_id, intervention_id } = req.body;
        const results = await db.query(
            "INSERT INTO component_inter (repair_change,last_values, component_id, intervention_id  ) VALUES ($1, $2, $3, $4) RETURNING *",
            [repair_change,last_values, component_id, intervention_id ]
        );
        res.status(201).json({
            status: "success",
            data: {
                component_inter: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
});


app.put("/api/v1/component_inter/:id", async (req, res) => {
    try {
        const {repair_change,last_values, component_id, intervention_id } = req.body;
        const results = await db.query(
            "UPDATE component_inter SET repair_change = $1, last_values = $2, component_id = $3 ,intervention_id = $4 WHERE id = $5 RETURNING *",
            [repair_change,last_values, component_id, intervention_id , req.params.id] // Include req.params.id here
        );
        res.status(200).json({
            status: "success",
            data: {
                component_inter: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.delete("/api/v1/component_inter/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM component_inter WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.post('/api/v1/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE userid = $1 AND password = $2";
    const values = [req.body.userid, req.body.password];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (data.rows.length > 0) {
            const name = data.rows[0].name;
            const token = jwt.sign({ name }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: true }); // Ensure secure cookie handling
            return res.json({ status: "success" }); // Use consistent key 'status'
        } else {
            return res.status(401).json({ message: "Invalid credentials" }); // Use status code 401 for unauthorized access
        }
    });
});


  const port = process.env.PORT ; 
app.listen(port, () => {
    console.log(`server is up listening ${port}`);
});