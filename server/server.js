require("dotenv").config();
const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const cors = require("cors");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const moment = require('moment-timezone');

const cron = require("node-cron");
// Set the timezone
moment.tz.setDefault('Africa/Tunis');

// Now you can use moment to handle timestamps
const now = moment().toDate(); 
now.setHours(now.getHours() + 1);  // Print the current time in ISO 8601 format

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    methods: ["POST", "GET", "DELETE", "PUT", "PATCH", "OPTIONS"],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
const cloudinaryCredentials = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
};
const hasCloudinaryCredentials = Object.values(cloudinaryCredentials).every(Boolean);
const wantsCloudinary = process.env.UPLOAD_STORAGE === "cloudinary";
const useCloudinary = Boolean(cloudinaryUrl || hasCloudinaryCredentials);
const allowLocalUploads = process.env.NODE_ENV !== "production" && !wantsCloudinary && !useCloudinary;

if (!useCloudinary && !allowLocalUploads) {
    console.error("Cloudinary uploads are required but credentials are missing. Configure CLOUDINARY_URL or all three CLOUDINARY_* variables.");
} else if (!cloudinaryUrl && Object.values(cloudinaryCredentials).some(Boolean) && !hasCloudinaryCredentials) {
    console.error("Cloudinary credentials are incomplete. Configure CLOUDINARY_URL or all three CLOUDINARY_* variables.");
}

if (!cloudinaryUrl && hasCloudinaryCredentials) {
    cloudinary.config({ ...cloudinaryCredentials, secure: true });
}

if (allowLocalUploads) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

function uploadedFile(req, ...fieldNames) {
    for (const fieldName of fieldNames) {
        const file = req.files?.[fieldName]?.[0];
        if (file) return file;
    }
    if (req.file && (!fieldNames.length || fieldNames.includes(req.file.fieldname))) {
        return req.file;
    }
    return null;
}

function uploadedFileUrl(req, fieldNames, existingValue = null) {
    return uploadedFile(req, ...fieldNames)?.path || existingValue || null;
}


const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Authentication token not provided" });
    } else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Authentication failed" });
            } else {
                // Attach decoded user information to the request object
                req.user = decoded;
                next();
            }
        });
    }
};
app.get('/', verifyUser, (req, res) => {
    return res.json({ status: "Success", name: req.user.name , role: req.user.role });
});



app.get("/health", async (_req, res) => {
    try {
        await db.checkConnection();
        await db.query(`
            SELECT secteur.id, secteur.ref, secteur.lib, secteur.description,
                   secteur.equipement_id, secteur.deleted, equipement.name AS equipement_name
            FROM public.secteur
            LEFT JOIN public.equipement ON secteur.equipement_id = equipement.id
            WHERE COALESCE(secteur.deleted, false) = false
            LIMIT 0
        `);
        return res.status(200).json({
            status: "ok",
            database: "connected",
            secteurSchema: "ready",
            uploadStorage: useCloudinary ? "cloudinary" : allowLocalUploads ? "local-development" : "not-configured",
        });
    } catch (err) {
        console.error("Database/schema health check failed:", err.message);
        return res.status(503).json({
            status: "error",
            database: err.code === "42P01" || err.code === "42703" ? "connected" : "unavailable",
            secteurSchema: "not_ready",
        });
    }
});
if (allowLocalUploads) {
    app.use("/uploads", express.static(uploadsDir));
}

// Upload directly to Cloudinary when configured; use local disk for development.
const storage = useCloudinary ? {
    _handleFile(_req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        const publicId = `${Date.now()}-${crypto.randomUUID()}${extension}`;
        let completed = false;
        const complete = (error, info) => {
            if (completed) return;
            completed = true;
            if (error) error.isCloudinaryUploadError = true;
            cb(error, info);
        };
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: process.env.CLOUDINARY_FOLDER || "gmao",
                public_id: publicId,
                resource_type: "auto",
                use_filename: false,
                unique_filename: false,
                overwrite: false,
            },
            (error, result) => {
                if (error) return complete(error);
                complete(null, {
                    filename: result.public_id,
                    path: result.secure_url,
                    size: result.bytes,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                });
            }
        );

        file.stream.once("error", complete);
        uploadStream.once("error", complete);
        file.stream.pipe(uploadStream);
    },
    _removeFile(_req, file, cb) {
        cloudinary.uploader.destroy(
            file.public_id || file.filename,
            { resource_type: file.resource_type || "image", type: "upload" },
            (error) => cb(error)
        );
    },
} : allowLocalUploads ? multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
}) : {
    _handleFile(_req, _file, cb) {
        const error = new Error("Cloudinary n'est pas configuré sur le serveur. L'upload est désactivé.");
        error.code = "CLOUDINARY_CONFIG_MISSING";
        cb(error);
    },
    _removeFile(_req, _file, cb) {
        cb(null);
    },
};

const upload = multer({ storage: storage });

// Routes for equipment
app.get("/api/v1/equipement", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT equipement.*, secteur.lib AS secteur_name, unit.unit AS unit_unit
            FROM equipement
            LEFT JOIN secteur ON equipement.secteur_id = secteur.id
            LEFT JOIN unit ON equipement.unit_id = unit.id
            WHERE equipement.deleted = false
        `);
        const secteurs = await db.query("SELECT id, lib FROM secteur WHERE deleted = false"); // Ajouter la condition WHERE
        const units = await db.query("SELECT id, unit FROM unit"); 

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                equipement: results.rows,
                secteurs: secteurs.rows,
                units: units.rows
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
            "SELECT equipement.*, secteur.lib AS secteur_name, unit.unit AS unit_unit " + // Ajout de l'espace après "unit AS unit_unit"
            "FROM equipement " +
            "LEFT JOIN secteur ON equipement.secteur_id = secteur.id " +
            "LEFT JOIN unit ON equipement.unit_id = unit.id " +
            "WHERE equipement.id = $1 AND equipement.deleted = false " +
            "AND (secteur.id IS NULL OR secteur.deleted = false)",
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


///get equip by name 

app.get("/api/v1/equipement/equipementName/:name", async (req, res) => {
    try {       
        const results = await db.query(
            `SELECT equipement.*, secteur.lib  AS secteur_name , unit.unit AS unit_unit
            FROM equipement 
            LEFT JOIN secteur ON equipement.secteur_id = secteur.id
            LEFT JOIN unit ON equipement.unit_id = unit.id
            WHERE equipement.deleted = false AND equipement.name = $1`,
            [req.params.name]
        );

        const secteurs = await db.query("SELECT id FROM secteur WHERE deleted = false");
        const units = await db.query("SELECT id FROM unit");
        res.status(200).json({
            status: "success",
            data: {
                equipement: results.rows[0],
                secteurs: secteurs.rows,
                units: units.rows

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




// For inserting equipment data
const equipmentUploadFields = [
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "fichier", maxCount: 1 },
];

app.post("/api/v1/equipement", upload.fields(equipmentUploadFields), async (req, res) => {    try {
        const imagePath = uploadedFileUrl(req, ["image"]);
        const fichierPath = uploadedFileUrl(req, ["file", "fichier"], req.body.fichier);
        const warrantyExpirationDate = req.body.warranty_expiration_date ? new Date(req.body.warranty_expiration_date) : null;
        const formattedWarrantyExpirationDate = warrantyExpirationDate ? warrantyExpirationDate.toISOString() : null;

        // Utilisation de la date et de l'heure actuelles dans le fuseau horaire UTC
        const lastMaintenanceDate = req.body.last_maint_date ? new Date(req.body.last_maint_date) : new Date();
        lastMaintenanceDate.setUTCHours(lastMaintenanceDate.getUTCHours() + 1); // Ajoute une heure
        const formattedLastMaintenanceDate = lastMaintenanceDate.toISOString();

        const results = await db.query(
            "INSERT INTO equipement (name, location, model, serial_number, status, image, description, warranty_expiration_date, cost, secteur_id, type, cycle, cout_unit, unit_id, current_value, last_maint_value, last_maint_date, descriptionprev, cout_intervention, duree_inter, type_maint, date_debut, date_fin, fichier, description_inter) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath,
                req.body.description,
                formattedWarrantyExpirationDate,
                req.body.cost,
                req.body.secteur_id,
                req.body.type,
                req.body.cycle,
                req.body.cout_unit,
                req.body.unit_id,
                req.body.current_value,
                req.body.last_maint_value,
                formattedLastMaintenanceDate, // Utilisation de la date formatée
                req.body.descriptionprev || null,
                req.body.cout_intervention,
                req.body.duree_inter,
                req.body.type_maint,
                req.body.date_debut,
                req.body.date_fin,
                fichierPath,
                req.body.description_inter || null
            ]
        );

        res.status(201).json({
            status: "success",
            data: {
                equipment: results.rows[0],
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




// For updating equipment data
/*
app.put("/api/v1/equipement/:id", upload.single('image'), async (req, res) => {
    try {
        let imagePath = req.body.image;
        if (req.file) {
            imagePath = req.file.path;
        }

        // Fetch the current equipment data to get the current value
        const currentEquipment = await db.query(
            "SELECT current_value FROM equipement WHERE id = $1", [req.params.id]
        );
        const currentEquipmentValue = currentEquipment.rows[0].current_value;

        // Check if the current_value in the request body is different from the current value in the database
        const isCurrentValueUpdated = req.body.current_value !== currentEquipmentValue;

        // Update the last_maint_value with the current_value only if current_value is updated
        if (isCurrentValueUpdated) {
            await db.query(
                "UPDATE equipement SET last_maint_value = $1 WHERE id = $2",
                [currentEquipmentValue, req.params.id]
            );
        }

        // Validate and format warranty expiration date
        let formattedWarrantyExpirationDate = null;
        if (req.body.warranty_expiration_date) {
            const warrantyExpirationDate = new Date(req.body.warranty_expiration_date);
            if (!isNaN(warrantyExpirationDate)) {
                formattedWarrantyExpirationDate = warrantyExpirationDate.toISOString().split('T')[0];
            } else {
                // Handle invalid warranty expiration date
                console.error("Invalid warranty expiration date format");
            }
        }

        const results = await db.query(
            "UPDATE equipement SET name = $1, location = $2, model = $3, serial_number = $4, status = $5, image = $6, description = $7, warranty_expiration_date = $8, cost = $9, secteur_id = $10, type = $11, cycle = $12, cout_unit = $13, unit_id = $14, current_value = $15, last_maint_date = $16, descriptionprev = $17 WHERE id = $18 RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath,
                req.body.description ,
                formattedWarrantyExpirationDate,
                req.body.costs,
                req.body.secteur_id,
                req.body.type,
                req.body.cycle,
                req.body.cout_unit,
                req.body.unit_id,
                req.body.current_value ,
                req.body.last_maint_date || null,
                req.body.descriptionprev || null,
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                equipment: results.rows[0],
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
*/
/* that work perfectly but just it didn't update the name in notifprev when i update it

app.put("/api/v1/equipement/:id", upload.single('image'), async (req, res) => {
    try {
        let imagePath = req.body.image;
        if (req.file) {
            imagePath = req.file.path;
        }

        // Fetch the current equipment data to get the current value
        const currentEquipment = await db.query(
            "SELECT current_value FROM equipement WHERE id = $1", [req.params.id]
        );
        const currentEquipmentValue = currentEquipment.rows[0].current_value;

        // Check if the current_value in the request body is different from the current value in the database
        const isCurrentValueUpdated = req.body.current_value !== currentEquipmentValue;

        // Update the last_maint_value with the current_value only if current_value is updated
        if (isCurrentValueUpdated) {
            await db.query(
                "UPDATE equipement SET last_maint_value = $1 WHERE id = $2",
                [currentEquipmentValue, req.params.id]
            );
        }

        // Validate and format warranty expiration date
        let formattedWarrantyExpirationDate = null;
        if (req.body.warranty_expiration_date) {
            const warrantyExpirationDate = new Date(req.body.warranty_expiration_date);
            if (!isNaN(warrantyExpirationDate)) {
                formattedWarrantyExpirationDate = warrantyExpirationDate.toISOString().split('T')[0];
            } else {
                // Handle invalid warranty expiration date
                console.error("Invalid warranty expiration date format");
            }
        }

        // Parse and format last_maint_date to avoid time zone issues
        let formattedLastMaintDate = null;
        if (req.body.last_maint_date) {
            const lastMaintDate = new Date(req.body.last_maint_date);
            if (!isNaN(lastMaintDate)) {
                formattedLastMaintDate = new Date(lastMaintDate.getTime() - (lastMaintDate.getTimezoneOffset() * 60000)).toISOString();
            } else {
                // Handle invalid last_maint_date
                console.error("Invalid last maintenance date format");
            }
        }

        const results = await db.query(
            "UPDATE equipement SET name = $1, location = $2, model = $3, serial_number = $4, status = $5, image = $6, description = $7, warranty_expiration_date = $8, cost = $9, secteur_id = $10, type = $11, cycle = $12, cout_unit = $13, unit_id = $14, current_value = $15, last_maint_date = $16, descriptionprev = $17 WHERE id = $18 RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath,
                req.body.description,
                formattedWarrantyExpirationDate,
                req.body.costs,
                req.body.secteur_id,
                req.body.type,
                req.body.cycle,
                req.body.cout_unit,
                req.body.unit_id,
                req.body.current_value,
                formattedLastMaintDate,
                req.body.descriptionprev || null,
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                equipment: results.rows[0],
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
*/ 
/*   working just fine but when i update the name here it doesn't get updated in the composant
app.put("/api/v1/equipement/:id", upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
    try {
        let imagePath = req.body.image;
        if (req.file) {
            imagePath = req.file.path;
        }
        let fichierPath = req.body.fichier;
        if (req.file) {
            fichierPath = req.file.path;
        }

        // Fetch the current equipment data to get the current value
        const currentEquipment = await db.query(
            "SELECT current_value, name FROM equipement WHERE id = $1", [req.params.id]
        );
        const currentEquipmentData = currentEquipment.rows[0];
        const currentEquipmentValue = currentEquipmentData.current_value;
        const currentEquipmentName = currentEquipmentData.name;

        // Check if the current_value or name in the request body is different from the current value in the database
        const isCurrentValueUpdated = req.body.current_value !== currentEquipmentValue;
        const isNameUpdated = req.body.name !== currentEquipmentName;

        // Update the last_maint_value with the current_value only if current_value is updated
        if (isCurrentValueUpdated) {
            await db.query(
                "UPDATE equipement SET last_maint_value = $1 WHERE id = $2",
                [currentEquipmentValue, req.params.id]
            );
        }

        // Update name in notifprev if it's updated
        if (isNameUpdated) {
            await db.query(
                "UPDATE notifprev SET name = $1 WHERE id = $2",
                [req.body.name, req.params.id]
            );
        }

        // Validate and format warranty expiration date
        let formattedWarrantyExpirationDate = null;
        if (req.body.warranty_expiration_date) {
            const warrantyExpirationDate = new Date(req.body.warranty_expiration_date);
            if (!isNaN(warrantyExpirationDate)) {
                formattedWarrantyExpirationDate = warrantyExpirationDate.toISOString().split('T')[0];
            } else {
                // Handle invalid warranty expiration date
                console.error("Invalid warranty expiration date format");
            }
        }

        // Parse and format last_maint_date to avoid time zone issues
        let formattedLastMaintDate = null;
        if (req.body.last_maint_date) {
            const lastMaintDate = new Date(req.body.last_maint_date);
            if (!isNaN(lastMaintDate)) {
                // Adjust for time zone offset
                formattedLastMaintDate = new Date(lastMaintDate.getTime() - (lastMaintDate.getTimezoneOffset() * 60000)).toISOString();
            } else {
                // Handle invalid last_maint_date
                console.error("Invalid last maintenance date format");
            }
        }

        const results = await db.query(
            "UPDATE equipement SET name = $1, location = $2, model = $3, serial_number = $4, status = $5, image = $6, description = $7, warranty_expiration_date = $8, cost = $9, secteur_id = $10, type = $11, cycle = $12, cout_unit = $13, unit_id = $14, current_value = $15, last_maint_date = $16, descriptionprev = $17, cout_intervention = $18, duree_inter = $19, type_maint = $20, date_debut = $21, date_fin = $22, fichier = $23, description_inter = $24 WHERE id = $25 RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath,
                req.body.description,
                formattedWarrantyExpirationDate,
                req.body.costs,
                req.body.secteur_id,
                req.body.type,
                req.body.cycle,
                req.body.cout_unit,
                req.body.unit_id,
                req.body.current_value,
                formattedLastMaintDate,
                req.body.descriptionprev || null,
                req.body.cout_intervention,
                req.body.duree_inter,
                req.body.type_maint,
                req.body.date_debut,
                req.body.date_fin,
                fichierPath,
                req.body.description_inter || null,
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                equipment: results.rows[0],
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

*/
app.put("/api/v1/equipement/:id", upload.fields(equipmentUploadFields), async (req, res) => {
    try {
        const imagePath = uploadedFileUrl(req, ["image"], req.body.image);
        const fichierPath = uploadedFileUrl(req, ["file", "fichier"], req.body.fichier || req.body.file);

        // Fetch the current equipment data to get the current value
        const currentEquipment = await db.query(
            "SELECT current_value, name FROM equipement WHERE id = $1", [req.params.id]
        );
        const currentEquipmentData = currentEquipment.rows[0];
        const currentEquipmentValue = currentEquipmentData.current_value;
        const currentEquipmentName = currentEquipmentData.name;

        // Check if the current_value or name in the request body is different from the current value in the database
        const isCurrentValueUpdated = req.body.current_value !== currentEquipmentValue;
        const isNameUpdated = req.body.name !== currentEquipmentName;

        // Update the last_maint_value with the current_value only if current_value is updated
        if (isCurrentValueUpdated) {
            await db.query(
                "UPDATE equipement SET last_maint_value = $1 WHERE id = $2",
                [currentEquipmentValue, req.params.id]
            );
        }

        // Update name in notifprev and composant if it's updated
        if (isNameUpdated) {
            await db.query(
                "UPDATE notifprev SET name = $1 WHERE id = $2",
                [req.body.name, req.params.id]
            );
            await db.query(
                "UPDATE composant SET name_equip = $1 WHERE id_equip = $2",
                [req.body.name, req.params.id]
            );
        }

        // Validate and format warranty expiration date
        let formattedWarrantyExpirationDate = null;
        if (req.body.warranty_expiration_date) {
            const warrantyExpirationDate = new Date(req.body.warranty_expiration_date);
            if (!isNaN(warrantyExpirationDate)) {
                formattedWarrantyExpirationDate = warrantyExpirationDate.toISOString().split('T')[0];
            } else {
                // Handle invalid warranty expiration date
                console.error("Invalid warranty expiration date format");
            }
        }

        // Parse and format last_maint_date to avoid time zone issues
        let formattedLastMaintDate = null;
        let formatDatefin = null;
        if (req.body.date_fin) {
            const Datefin = new Date(req.body.date_fin);
            if (!isNaN(Datefin)) {
                // Adjust for time zone offset
                formatDatefin = new Date(Datefin.getTime() - (Datefin.getTimezoneOffset() * 60000)).toISOString();
                formattedLastMaintDate = formatDatefin;  // Update last_maint_date with the value of date_fin
            } else {
                // Handle invalid date_fin
                console.error("Invalid date fin date format");
            }
        }

        let formatDatedebut = null;
        if (req.body.date_debut) {
            const Datedebut = new Date(req.body.date_debut);
            if (!isNaN(Datedebut)) {
                // Adjust for time zone offset
                formatDatedebut = new Date(Datedebut.getTime() - (Datedebut.getTimezoneOffset() * 60000)).toISOString();
            } else {
                // Handle invalid date_debut
                console.error("Invalid date debut date format");
            }
        }

        const results = await db.query(
            "UPDATE equipement SET name = $1, location = $2, model = $3, serial_number = $4, status = $5, image = $6, description = $7, warranty_expiration_date = $8, cost = $9, secteur_id = $10, type = $11, cycle = $12, cout_unit = $13, unit_id = $14, current_value = $15, last_maint_date = $16, descriptionprev = $17, cout_intervention = $18, duree_inter = $19, type_maint = $20, date_debut = $21, date_fin = $22, fichier = $23, description_inter = $24 WHERE id = $25 RETURNING *",
            [
                req.body.name,
                req.body.location,
                req.body.model,
                req.body.serial_number,
                req.body.status,
                imagePath,
                req.body.description,
                formattedWarrantyExpirationDate,
                req.body.costs,
                req.body.secteur_id,
                req.body.type,
                req.body.cycle,
                req.body.cout_unit,
                req.body.unit_id,
                req.body.current_value,
                formattedLastMaintDate,
                req.body.descriptionprev || null,
                req.body.cout_intervention,
                req.body.duree_inter,
                req.body.type_maint,
                formatDatedebut,
                formatDatefin,
                fichierPath,
                req.body.description_inter || null,
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                equipment: results.rows[0],
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

/// update just the multiple current_values at the same time
app.put('/api/v1/equipement_current', async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates)) {
            return res.status(400).json({ status: 'error', message: 'Invalid input format' });
        }

        const updatePromises = updates.map(update =>
            db.query(
                'UPDATE equipement SET current_value = $1 WHERE id = $2',
                [update.current_value, update.id]
            )
        );

        await Promise.all(updatePromises);

        res.status(200).json({ status: 'success', message: 'Values updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'An error occurred while updating values' });
    }
});




///
app.delete("/api/v1/equipement/:id", async (req, res) => {
    const equipementId = req.params.id;
    try {
        // Check if the equipment is related to any other data
        const relatedData1 = await db.query(
            "SELECT COUNT(*) FROM secteur WHERE equipement_id = $1", [equipementId]
        );
        const relatedData2 = await db.query(
            "SELECT COUNT(*) FROM prop_function WHERE equipement_id = $1", [equipementId]
        );
        const relatedData3 = await db.query(
            "SELECT COUNT(*) FROM prop_equip WHERE equipement_id = $1", [equipementId]
        );
        const relatedData4 = await db.query(
            "SELECT COUNT(*) FROM reclamation WHERE equipement_id = $1", [equipementId]
        );
        const relatedData5 = await db.query(
            "SELECT COUNT(*) FROM intervention WHERE equipement_id = $1", [equipementId]
        );
        const relatedData6 = await db.query(
            "SELECT COUNT(*) FROM component WHERE equipement_id = $1", [equipementId]
        );
        
        // Check if the equipment is related to any other data in any of the tables
        if (
            relatedData1.rows[0].count !== 0 ||
            relatedData2.rows[0].count !== 0 ||
            relatedData3.rows[0].count !== 0 ||
            relatedData4.rows[0].count !== 0 ||
            relatedData5.rows[0].count !== 0 ||
            relatedData6.rows[0].count !== 0
        ) {
            // If the equipment is related to other data, soft delete it by setting the 'deleted' column to true
            await db.query("UPDATE equipement SET deleted = true WHERE id = $1", [equipementId]);
        } else {
            // If the equipment is not related to any other data, delete it permanently
            await db.query("DELETE FROM equipement WHERE id = $1", [equipementId]);
        }

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




app.get("/api/v1/equipement/:id/references", async (req, res) => {
    const equipementId = req.params.id;
    try {
        // Check if the equipment ID is referenced in other tables
        const response = await db.query(
            "SELECT EXISTS (" +
                "SELECT 1 FROM prop_equip WHERE equipement_id = $1 " +
                "UNION " +
                "SELECT 1 FROM prop_function WHERE equipement_id = $1 " +
                "UNION " +
                "SELECT 1 FROM intervention WHERE equipement_id = $1 " +
                "UNION " +
                "SELECT 1 FROM secteur WHERE equipement_id = $1 " +
                "UNION " +
                "SELECT 1 FROM reclamation WHERE equipement_id = $1 " +
                "UNION " +
                "SELECT 1 FROM component WHERE equipement_id = $1 " +
            ") AS hasReferences",
            [equipementId]
        );

        // Extract the result from the response
        const hasReferences = response.rows[0].hasreferences;

        res.json({ hasReferences });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get('/api/v1/check-serial-number', async (req, res) => {
    const { serial_number, id } = req.query;

    try {
        // Recherche dans la base de données si un équipement avec ce numéro de série existe
        // Exclure l'équipement en cours de la vérification en utilisant son ID
        const existingEquipment = await db.query("SELECT * FROM equipement WHERE serial_number = $1 AND id != $2", [serial_number, id]);

        // Si un équipement avec ce numéro de série existe, renvoyez un message d'erreur
        if (existingEquipment.rows.length > 0) {
            return res.status(400).json({ error: 'Ce numéro de série est déjà utilisé. Veuillez en choisir un autre.' });
        }
        
        // Si le numéro de série est unique, renvoyez un message indiquant qu'il est disponible
        res.json({ message: 'Le numéro de série est unique.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la vérification du numéro de série.' });
    }
});

app.get('/api/v1/check-serial-number_add', async (req, res) => {
    const { serial_number } = req.query;

    try {
        // Recherche dans la base de données si un équipement avec ce numéro de série existe
        const existingEquipment = await db.query("SELECT * FROM equipement WHERE serial_number = $1", [serial_number]);

        // Si un équipement avec ce numéro de série existe, renvoyez un message d'erreur
        if (existingEquipment.rows.length > 0) {
            return res.status(400).json({ error: 'Ce numéro de série est déjà utilisé. Veuillez en choisir un autre.' });
        }
        
        // Si le numéro de série est unique, renvoyez un message indiquant qu'il est disponible
        res.json({ message: 'Le numéro de série est unique.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la vérification du numéro de série.' });
    }
});



// employee routes 

app.get("/api/v1/employee", async (req, res) => {
    try {
        const results = await db.query("select * from employee where deleted = false ");
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

app.get("/api/v1/employeelist", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM employee WHERE deleted = false AND userid NOT IN (SELECT userid FROM users WHERE id = 1)");
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


app.post("/api/v1/employee", upload.single('file'), async (req, res) => {
    try {
        // Assurez-vous que le chemin du document est correctement extrait de la requête
        const documentPath = req.file ? req.file.path : null;

        // Si vous devez analyser une date depuis le frontend, assurez-vous de le faire ici

        const results = await db.query(
            "INSERT INTO employee (firstname, userid, post, documents, job_title, phone, email, cin, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [
                req.body.firstname,
                req.body.userid,
                req.body.post,
                documentPath,
                req.body.job_title,
                req.body.phone,
                req.body.email,
                req.body.cin,
                req.body.password,
                req.body.role
            ]
        );

        // Assurez-vous d'utiliser des paramètres sécurisés pour éviter les injections SQL
        const addUserResult = await db.query(
            "INSERT INTO users (name, userid, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [
                req.body.firstname, // Assumant que firstname est le nom de l'employé
                req.body.userid,
                req.body.password,
                req.body.role
            ]
        );

        // If the role is "technician", insert the employee into the technician table as well
        if (req.body.role === 'technician') {
            const addTechnicianResult = await db.query(
                "INSERT INTO technicien (name, userid, post, email) VALUES ($1, $2, $3, $4) RETURNING *",
                [
                    req.body.firstname,
                    req.body.userid,
                    req.body.post,
                    req.body.email
                ]
            );
        }

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

app.put("/api/v1/employee/:id", upload.single('file'), async (req, res) => {
    try {
        let documentPath = req.body.file; // Get the existing image path from the request body
        if (req.file) {
            documentPath = req.file.path; // If a new image is uploaded, update the image path
        }

        const results = await db.query(
            "UPDATE employee SET firstname = $1, userid=$2, post = $3, documents = $4, job_title = $5, phone = $6, email = $7, cin = $8, password = $9, role = $10 WHERE id = $11 RETURNING userid, role", // Add RETURNING userid and role
            [
                req.body.firstname,
                req.body.userid,
                req.body.post,
                documentPath,
                req.body.job_title,
                req.body.phone,
                req.body.email,
                req.body.cin,
                req.body.password,
                req.body.role,
                req.params.id
            ]
        );

        // Update the role in the users table
        await db.query(
            "UPDATE users SET role = $1 WHERE userid = $2",
            [
                req.body.role,
                results.rows[0].userid // Use the returned userid
            ]
        );

        // If the role is changed to 'technician', check if the employee is already in the technicien table
        if (req.body.role === 'technician') {
            const existingTechnician = await db.query(
                "SELECT * FROM technicien WHERE userid = $1",
                [results.rows[0].userid]
            );
            // If the employee is not already in the technicien table, insert them
            if (existingTechnician.rows.length === 0) {
                await db.query(
                    "INSERT INTO technicien (name, userid, post, email) VALUES ($1, $2, $3, $4)",
                    [
                        req.body.firstname,
                        req.body.userid,
                        req.body.post,
                        req.body.email
                    ]
                );
            } else {
                // If the employee is already in the technicien table, update their information
                await db.query(
                    "UPDATE technicien SET name = $1, post = $2, email = $3 WHERE userid = $4",
                    [
                        req.body.firstname,
                        req.body.post,
                        req.body.email,
                        req.body.userid
                    ]
                );
            }
        }

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



/*
app.put("/api/v1/employee/:id", upload.single('file'),  async (req, res) =>{
        try {
            let documentPath = req.body.file; // Get the existing image path from the request body
            if (req.file) {
                documentPath = req.file.path; // If a new image is uploaded, update the image path
            }
    
            const results = await db.query(
                "UPDATE employee SET firstname = $1, userid=$2, post = $3, documents = $4, job_title = $5, phone = $6, email = $7, cin = $8, password = $9, role = $10 WHERE id = $11 RETURNING *",
                [
                    req.body.firstname,
                    req.body.userid,
                    req.body.post,
                    documentPath,
                    req.body.job_title,
                    req.body.phone,
                    req.body.email,
                    req.body.cin,
                    req.body.password,
                    req.body.role,
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
*/

/*
app.delete("/api/v1/employee/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;
        // Mettre à jour la valeur de la colonne deleted à true au lieu de supprimer réellement la ligne
        await db.query("UPDATE employee SET deleted = true WHERE id = $1", [employeeId]);
        // Supprime l'utilisateur de la table "users"
        await db.query("UPDATE users SET deleted = true WHERE userid = $1", [employeeId]);
        
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});
*/
/*
app.delete("/api/v1/employee/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;
        // Delete the employee from the employee table
        await db.query("DELETE FROM employee WHERE id = $1", [employeeId]);
        // Also delete the corresponding user from the users table
        await db.query("DELETE FROM users WHERE userid = $1", [employeeId]); 
        await db.query("DELETE FROM technicien WHERE userid = $1", [employeeId]); 

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});*/

app.delete("/api/v1/employee/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;
        // Delete the employee from the employee table
        await db.query("DELETE FROM employee WHERE id = $1", [employeeId]);
        // Also delete the corresponding user from the users table
        await db.query("DELETE FROM users WHERE userid = $1", [employeeId]); 
        // Update the technician table to set deleted state to true
        await db.query("UPDATE technicien SET deleted = true WHERE userid = $1", [employeeId]); // Assuming userid corresponds to the employee id
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/*
app.delete("/api/v1/employee/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;

            // If the employee is a technician, update the deleted state
            await db.query("UPDATE technicien SET deleted = true WHERE userid = $1", [employeeId]);
        

        // Delete the employee from the employee table
        await db.query("update employee set deleted = true WHERE id = $1", [employeeId]);

        // Also delete the corresponding user from the users table
        await db.query("DELETE FROM users WHERE userid = $1", [employeeId]); 

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
*/

/*
app.delete("/api/v1/employee/:id", async (req, res) => {
    const employeeId = req.params.id;
    try {
        // Check if the employee is related to any other data
        const relatedData1 = await db.query(
            "SELECT COUNT(*) FROM intervention WHERE employee_id = $1", [employeeId]
        );
        const relatedData2 = await db.query(
            "SELECT COUNT(*) FROM reclamation WHERE responsible = $1", [employeeId]
        );
        const relatedData3 = await db.query(
            "SELECT COUNT(*) FROM affectation_inter WHERE technicien_id = $1", [employeeId]
        );
        const relatedData4 = await db.query(
            "SELECT COUNT(*) FROM technicien WHERE userid = $1", [employeeId]
        );
        
        // Check if the employee is related to any other data in any of the tables
        if (
            relatedData1.rows[0].count !== 0 ||
            relatedData2.rows[0].count !== 0 ||
            relatedData3.rows[0].count !== 0 ||
            relatedData4.rows[0].count !== 0
        ) {
            // If the employee is related to other data, soft delete it by setting the 'deleted' column to true
            await db.query("UPDATE employee SET deleted = true WHERE userid = $1", [employeeId]);
            await db.query("UPDATE technicien SET deleted = true WHERE userid = $1", [employeeId]);
        } else {
            // If the employee is not related to any other data, delete it permanently
            await db.query("DELETE FROM employee WHERE userid = $1", [employeeId]);
        }

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
*/




app.get('/api/v1/checkCinUniqueness', async (req, res) => {
    const { cin, id } = req.query;

    try {
        // Recherche dans la base de données si un équipement avec ce numéro de série existe
        // Exclure l'équipement en cours de la vérification en utilisant son ID
        const existingCin = await db.query("SELECT * FROM employee WHERE cin = $1 AND id != $2", [cin, id]);

        // Si un équipement avec ce numéro de série existe, renvoyez un message d'erreur
        if (existingCin.rows.length > 0) {
            return res.status(400).json({ error: 'Ce cin est déjà utilisé. Veuillez en choisir un autre.' });
        }
        
        // Si le numéro de série est unique, renvoyez un message indiquant qu'il est disponible
        res.json({ message: 'Le cin est unique.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la vérification du cin.' });
    }
});

app.get('/api/v1/checkCinUniqueness_add', async (req, res) => {
    const { cin } = req.query;

    try {
        // Recherche dans la base de données si un équipement avec ce numéro de série existe
        const existingCin = await db.query("SELECT * FROM employee WHERE cin = $1", [cin]);

        // Si un équipement avec ce numéro de série existe, renvoyez un message d'erreur
        if (existingCin.rows.length > 0) {
            return res.status(400).json({ error: 'Ce cin est déjà utilisé. Veuillez en choisir un autre.' });
        }
        
        // Si le numéro de série est unique, renvoyez un message indiquant qu'il est disponible
        res.json({ message: 'cin est unique.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Une erreur s\'est produite lors de la vérification du cin.' });
    }
});



///////****** technicien ********/

app.get("/api/v1/technicien", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM employee WHERE role = 'technician' AND deleted = false");
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


app.get("/api/v1/technicien/techid", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM technicien where deleted = false");
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
// Server-side code
/*
app.get("/api/v1/technicien/techid", async (req, res) => {
    try {
        const results = await db.query("SELECT id, userid FROM technicien WHERE deleted = false");
        res.status(200).json({
            status: "success",
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

app.get("/api/v1/technicien/userid", async (req, res) => {
    try {
        const results = await db.query("SELECT userid FROM users WHERE deleted = false");
        res.status(200).json({
            status: "success",
            data: {
                users: results.rows,
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
*/


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
            WHERE COALESCE(secteur.deleted, false) = false
        `);

        const equipments = await db.query("SELECT id, name FROM equipement");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                secteurs: results.rows,
                equipments: equipments.rows
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de la récupération des secteurs.",
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
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de la récupération du secteur.",
        });
    }
});

app.post("/api/v1/secteur", async (req, res) => {
    try {
        const { ref, lib, description, equipement_id } = req.body;
        if (!ref?.trim() || !lib?.trim()) {
            return res.status(400).json({
                status: "error",
                message: "La référence et le libellé sont obligatoires.",
            });
        }
        const results = await db.query(
            "INSERT INTO secteur (ref, lib, description, equipement_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [ref.trim(), lib.trim(), description || null, equipement_id || null]
        );
        res.status(201).json({
            status: "success",
            data: {
                secteur: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de l'ajout du secteur.",
        });
    }
});

app.put("/api/v1/secteur/:id", async (req, res) => {
    try {
        const { ref, lib, description } = req.body;
        const results = await db.query(
            "UPDATE secteur SET ref = $1, lib = $2, description = $3 WHERE id = $4 RETURNING *",
            [ref, lib, description, req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                secteur: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de la mise à jour du secteur.",
        });
    }
});

app.delete("/api/v1/secteur/:id", async (req, res) => {
    const sectorId = req.params.id;
    try {
        const relatedData = await db.query(
            "SELECT COUNT(*) FROM equipement WHERE secteur_id = $1", [sectorId]
        );

        if (relatedData.rows[0].count === '0') {
            await db.query("DELETE FROM secteur WHERE id = $1", [sectorId]);
        } else {
            await db.query("UPDATE secteur SET deleted = true WHERE id = $1", [sectorId]);
        }

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Une erreur s'est produite lors de la suppression du secteur.",
        });
    }
});


// component ///////////////////////////////////////////////////////////////////



app.get("/api/v1/component", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT component.*, equipement.name AS equipement_name
            FROM component
            LEFT JOIN equipement ON component.equipement_id = equipement.id
            WHERE component.deleted = false
        `);
        const equipments = await db.query("SELECT id, name FROM equipement WHERE deleted = false");
      
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
        // Mettre à jour la valeur de la colonne deleted à true au lieu de supprimer réellement la ligne
        await db.query("UPDATE component SET deleted = true WHERE id = $1", [req.params.id]);
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





app.delete("/api/v1/component/:id", async (req, res) => {
    const equipementId = req.params.id;
    try {
        // Check if the equipment is related to any other data
        const relatedData1 = await db.query(
            "SELECT COUNT(*) FROM component WHERE component_id = $1", [componentId]
        );
        const relatedData2 = await db.query(
            "SELECT COUNT(*) FROM prop_function WHERE component_id = $1", [componentId]
        );
        const relatedData3 = await db.query(
            "SELECT COUNT(*) FROM prop_component WHERE component_id = $1", [componentId]
        );
      
        
        // Check if the equipment is related to any other data in any of the tables
        if (
            relatedData1.rows[0].count !== 0 ||
            relatedData2.rows[0].count !== 0 ||
          
            relatedData3.rows[0].count !== 0
        ) {
            // If the equipment is related to other data, soft delete it by setting the 'deleted' column to true
            await db.query("UPDATE component SET deleted = true WHERE id = $1", [componentId]);
        } else {
            // If the equipment is not related to any other data, delete it permanently
            await db.query("DELETE FROM component WHERE id = $1", [componentId]);
        }

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/****************composant 2 */


app.get("/api/v1/composant", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT * FROM composant
            WHERE composant.deleted = false
        `);
      
        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                composants: results.rows,
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

app.get("/api/v1/composant/:id", async (req, res) => {
    try {
        const composant = await db.query(
            "SELECT * FROM composant WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                composant: composant.rows[0],
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

app.post("/api/v1/composant", upload.single('file'), async (req, res) => {
    try {
        const { id_equip, name_equip, name_comp, reference, type, cycle, current_value, last_maint_value, last_maint_date, description,unit_id } = req.body;
        const filePath = req.file ? req.file.path : null;

        const results = await db.query(
            `INSERT INTO composant (id_equip, name_equip, name_comp, reference, type, cycle, current_value, last_maint_value, last_maint_date, description, fichier, unit_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
           [id_equip, name_equip, name_comp, reference, type, cycle, current_value, last_maint_value, last_maint_date, description, filePath, unit_id]
        );      
        res.status(201).json({
            status: "success",
            data: {
                composant: results.rows[0],
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


/****************************************** code of the current value taken from the equipement

app.post("/api/v1/composant", upload.single('file'), async (req, res) => {
    try {
        const { id_equip, name_equip, name_comp, reference, type, cycle, unit, last_maint_value, last_maint_date, description } = req.body;
        const filePath = req.file ? req.file.path : null;

        // Get the current_value from the equipement table
        const equipementResult = await db.query(
            "SELECT current_value FROM equipement WHERE id = $1",
            [id_equip]
        );

        if (equipementResult.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Equipment not found",
            });
        }

        const current_value = equipementResult.rows[0].current_value;

        const results = await db.query(
            `INSERT INTO composant (id_equip, name_equip, name_comp, reference, type, cycle, unit, current_value, last_maint_value, last_maint_date, description, fichier) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
            [id_equip, name_equip, name_comp, reference, type, cycle, unit, current_value, last_maint_value, last_maint_date, description, filePath]
        );

        res.status(201).json({
            status: "success",
            data: {
                composant: results.rows[0],
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


*/
app.put("/api/v1/composant/:id", upload.single('file'), async (req, res) => {
    try {
        const { id_equip, name_equip, name_comp, reference, type, cycle, current_value, last_maint_value, last_maint_date, description ,unit_id } = req.body;
        const filePath = req.file ? req.file.path : req.body.file;

        const results = await db.query(
            `UPDATE composant 
            SET id_equip = $1, name_equip = $2, name_comp = $3, reference = $4, type = $5, cycle = $6, current_value = $7, last_maint_value = $8, last_maint_date = $9, description = $10, fichier = $11, unit_id = $12  
            WHERE id = $13 
            RETURNING *`,
            [id_equip, name_equip, name_comp, reference, type, cycle, current_value, last_maint_value, last_maint_date, description, filePath,unit_id, req.params.id]
        );

        res.status(200).json({
            status: "success",
            data: {
                composant: results.rows[0],
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

app.delete("/api/v1/composant/:id", async (req, res) => {
    try {
        await db.query("UPDATE composant SET deleted = true WHERE id = $1", [req.params.id]);
        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



/*
app.delete("/api/v1/component/:id", async (req, res) => {
    const equipementId = req.params.id;
    try {
        // Check if the equipment is related to any other data
        const relatedData1 = await db.query(
            "SELECT COUNT(*) FROM component WHERE component_id = $1", [componentId]
        );
        const relatedData2 = await db.query(
            "SELECT COUNT(*) FROM prop_function WHERE component_id = $1", [componentId]
        );
        const relatedData3 = await db.query(
            "SELECT COUNT(*) FROM prop_component WHERE component_id = $1", [componentId]
        );
      
        
        // Check if the equipment is related to any other data in any of the tables
        if (
            relatedData1.rows[0].count !== 0 ||
            relatedData2.rows[0].count !== 0 ||
          
            relatedData3.rows[0].count !== 0
        ) {
            // If the equipment is related to other data, soft delete it by setting the 'deleted' column to true
            await db.query("UPDATE component SET deleted = true WHERE id = $1", [componentId]);
        } else {
            // If the equipment is not related to any other data, delete it permanently
            await db.query("DELETE FROM component WHERE id = $1", [componentId]);
        }

        res.status(204).json({
            status: "success",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


*/
app.get("/api/v1/composant_equip/:name_equip", async (req, res) => {
    try {
        // Retrieve the id_equip from the URL parameters
        const name_equip = req.params.name_equip;
        console.log(`Fetching components with id_equip: ${name_equip}`);

        // Query the composant table to get all components with the specified id_equip
        const results = await db.query(
            "SELECT * FROM composant WHERE name_equip = $1 AND deleted = false",
            [name_equip]
        );

        // Log the query results for debugging
        console.log(`Query results: ${JSON.stringify(results.rows)}`);

        // Return the results as a JSON response
        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                composants: results.rows,
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
            
            WHERE prop_function.deleted = false
        `);
        const components = await db.query("SELECT id, name FROM component WHERE deleted = false");

        const equipments = await db.query("SELECT id, name FROM equipement WHERE deleted = false");

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

///** for equipement property  */

app.get("/api/v1/equipement/:name/prop_function", async (req, res) => {
    const equipementName = req.params.name;
    try {
        // Query to retrieve property function information associated with the specified equipment
        const results = await db.query(`
            SELECT pf.name, pf.type, pf.unit
            FROM prop_function pf
            JOIN equipement e ON pf.equipement_id = e.id
            WHERE e.name = $1 AND pf.deleted = false;
        `, [equipementName]);

        res.status(200).json({
            status: "success",
            data: {
                prop_function: results.rows,
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

/************for component function  */

app.get("/api/v1/component/:name/prop_function", async (req, res) => {
    const componentName = req.params.name;
    try {
        // Query to retrieve property function information associated with the specified equipment
        const results = await db.query(`
            SELECT pf.name, pf.type, pf.unit
            FROM prop_function pf
            JOIN component e ON pf.component_id = e.id
            WHERE e.name = $1 AND pf.deleted = false;
        `, [componentName]);

        res.status(200).json({
            status: "success",
            data: {
                prop_function: results.rows,
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
 //************* */

 app.post("/api/v1/ReadEquipement/AddProp_function2/:equipement_id", async (req, res) => {
    try {
        const { nameinput, type, unit, component_id } = req.body;
        const { equipement_id } = req.params;
        const results = await db.query(
            "INSERT INTO prop_function (name, type, unit, component_id, equipement_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [nameinput, type, unit, component_id, equipement_id]
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
/**************************************
 * 
 * 
 *  app.post("/api/v1/ReadEquipement/AddProp_function2/:equipement_id", async (req, res) => {
    try {
        const { nameinput, type, unit, component_id } = req.body;
        const { equipement_id } = req.params;

        // Vérifier si une propriété de fonctionnement avec le même nom existe déjà pour cet équipement
        const existingPropFunction = await db.query(
            "SELECT id FROM prop_function WHERE name = $1 AND equipement_id = $2",
            [nameinput, equipement_id]
        );

        if (existingPropFunction.rows.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Cette propriété de fonctionnement existe déjà pour cet équipement.",
            });
        }

        // Si la vérification réussit, insérer la nouvelle propriété de fonctionnement
        const results = await db.query(
            "INSERT INTO prop_function (name, type, unit, component_id, equipement_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [nameinput, type, unit, component_id, equipement_id]
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

 */



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
        // Update the 'deleted' column instead of deleting the row
        await db.query("UPDATE prop_function SET deleted = TRUE WHERE id = $1", [req.params.id]);
        
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
        const equipments = await db.query("SELECT id, name FROM equipement  WHERE deleted = false ");
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

app.get("/api/v1/equipement/:name/prop_equip", async (req, res) => {
    const equipementName = req.params.name;
    try {
        // Query to retrieve property function information associated with the specified equipment
        const results = await db.query(`
            SELECT pe.current_value, pe.cycle, pe.last_maint_value,pe.last_maint_date,pe.description
            FROM prop_equip pe
            JOIN equipement e ON pe.equipement_id = e.id
            WHERE e.name = $1 ;
        `, [equipementName]);

        res.status(200).json({
            status: "success",
            data: {
                prop_equip: results.rows,
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
            composant.name_comp AS composant_name,
            employee.firstname AS responsible_name,
            technicien.name  AS technicien_name 
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            LEFT JOIN composant ON reclamation.composant_id = composant.id
            LEFT JOIN employee ON reclamation.responsible = employee.id
            LEFT JOIN technicien ON reclamation.technicien_id = technicien.id
            WHERE reclamation.deleted = false
        `);
        const equipments = await db.query("SELECT id, name FROM equipement WHERE deleted = false");
        const composants = await db.query("SELECT id, name_comp FROM composant WHERE deleted = false");
        const employees = await db.query("SELECT id, firstname FROM employee WHERE deleted = false");
        const techniciens = await db.query("SELECT id, name FROM technicien WHERE deleted = false");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                reclamations: results.rows,
                equipments: equipments.rows,
                composants: composants.rows,
                employees: employees.rows,
                techniciens: techniciens.rows
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
        let {
            ref,
            equipement_id,
            priority,
            state,
            created_by,
            responsible,
            creation_date,
            final_date,
            planified_date,
            duration,
            description,
            technicien_id,
            datepanne,
            composant_id,
            predictive,
        } = req.body;

        // Convert incoming date strings to Date objects
        creation_date = new Date(creation_date);
        final_date = final_date ? new Date(final_date) : null;
        planified_date = planified_date ? new Date(planified_date) : null;
        datepanne = datepanne ? new Date(datepanne) : null;

        // Ensure nullable fields are explicitly set to null if undefined
        if (!final_date) final_date = null;
        if (!planified_date) planified_date = null;
        if (!duration) duration = null;
        if (!composant_id) composant_id = null; // Handle composant_id being null

        const results = await db.query(
            "INSERT INTO reclamation (ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id, predictive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id, predictive]
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
        const { ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id, predictive} = req.body;
        const results = await db.query(
            "UPDATE reclamation SET ref = $1, equipement_id = $2, priority = $3, state = $4, created_by = $5, responsible = $6, creation_date = $7, final_date = $8, planified_date = $9, duration = $10, description = $11, technicien_id = $12, datepanne = $13, composant_id = $14, predictive = $15 WHERE id = $16 RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id, predictive, req.params.id]
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
/*
app.put("/api/v1/reclamation/reclamationRef/:ref", async (req, res) => {
    try {
        const { ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, affecter , technicien_id } = req.body;

        const results = await db.query(
            `UPDATE reclamation 
             SET ref = $1, equipement_id = $2, priority = $3, state = $4, 
                 created_by = $5, responsible = $6, creation_date = $7, 
                 final_date = $8, planified_date = $9, duration = $10, 
                 description = $11, affecter = $12, technicien_id = $13 
             WHERE ref = $14
             RETURNING *`,
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, affecter, technicien_id, req.params.ref]
        );

        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Reclamation not found",
            });
        }

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

*/


app.put("/api/v1/reclamation/reclamationRef/:ref", async (req, res) => {
    try {
        const { affecter , technicien_id } = req.body;

        const results = await db.query(
            `UPDATE reclamation 
             SET  affecter = $1, technicien_id = $2 
             WHERE ref = $3
             RETURNING *`,
            [  affecter, technicien_id, req.params.ref]
        );

        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Reclamation not found",
            });
        }

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
/*second true one
app.get("/api/v1/reclamation/reclamationRef/:ref", async (req, res) => {
    try {
       
        const results = await db.query(
            `SELECT reclamation.*, equipement.name AS equipement_name,
            equipement.image AS equipement_image
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            WHERE reclamation.deleted = false AND reclamation.ref = $1`,
            [req.params.ref]
        );

        const equipments = await db.query("SELECT id, name, image FROM equipement WHERE deleted = false");

        res.status(200).json({
            status: "success",
            data: {
                reclamation: results.rows[0],
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
*/

app.get("/api/v1/reclamation/reclamationRef/:ref", async (req, res) => {
    try {       
        const results = await db.query(
            `SELECT reclamation.*, equipement.name AS equipement_name,
            composant. name_comp AS composant_name,
            equipement.image AS equipement_image
            FROM reclamation 
            LEFT JOIN composant ON reclamation.composant_id = composant.id
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            WHERE reclamation.deleted = false AND reclamation.ref = $1`,
            [req.params.ref]
        );

        const equipments = await db.query("SELECT id, name, image FROM equipement WHERE deleted = false");
        const composants = await db.query("SELECT id, name_equip, name_comp, reference FROM composant WHERE deleted = false");

        res.status(200).json({
            status: "success",
            data: {
                reclamation: results.rows[0],
                equipments: equipments.rows,
                composants : composants.rows
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


/*
app.get("/api/v1/reclamation/reclamationRef/:ref", async (req, res) => {
    try {
        const results = await db.query(
            "SELECT * FROM reclamation WHERE ref = $1",
            [req.params.ref]
        );
        res.status(200).json({
            status: "success",
            data: {
                reclamation: results.rows[0],
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
*/
app.delete("/api/v1/reclamation/:id", async (req, res) => {
    try {
        await db.query("UPDATE reclamation SET deleted = true WHERE id = $1", [req.params.id]);
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

app.get("/api/v1/reclamation2", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT MAX(id) AS lastid FROM reclamation");
        const lastId = rows.length > 0 ? parseInt(rows[0].lastid) : 0; // Convertir lastid en entier, ou 0 si la table est vide
        res.status(200).json({
            status: "success",
            data: {
                lastId
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
app.get("/api/v1/notifications/:technicien_id", async (req, res) => {
    try {
        const { rows: notifications } = await db.query(
            "SELECT ref, equipement_id, priority, datepanne, composant_id, state FROM reclamation WHERE technicien_id = $1 AND deleted = false AND state != 'Terminée'",
            [req.params.technicien_id]
        );
        const { rows: techniciens } = await db.query(
            "SELECT * FROM technicien WHERE id = $1",
            [req.params.technicien_id]
        );
        const { rows: equipments } = await db.query(
            "SELECT id, name, image FROM equipement WHERE deleted = false"
        );
        const { rows: composants } = await db.query(
            "SELECT id, name_equip, name_comp, reference FROM composant WHERE deleted = false"
        );
        res.status(200).json({
            status: "success",
            data: {
                notifications: notifications,
                techniciens: techniciens,
                equipments: equipments,
                composants: composants
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
app.get("/api/v1/notificationsemployee", async (req, res) => {
    try {
        const { rows: notifications } = await db.query(
            "SELECT ref, equipement_id, priority, datepanne, composant_id, state FROM reclamation WHERE state != 'Terminée'"
        );
       
        const { rows: equipments } = await db.query(
            "SELECT id, name, image FROM equipement WHERE deleted = false"
        );

        res.status(200).json({
            status: "success",
            data: {
                notifications,
                equipments
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/notificationsemployee endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});



app.get("/api/v1/notifications_admin", async (req, res) => {
    try {
        const results = await db.query("SELECT ref, equipement_id, priority, composant_id FROM reclamation WHERE affecter IS NULL AND deleted = false");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                notifications: results.rows,
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
/*
app.get("/api/v1/notifications_prev", async (req, res) => {
    try {
        const { rows: equipment } = await db.query("SELECT id, name, cycle, current_value, last_maint_date, last_maint_value FROM equipement WHERE deleted = false");

        const notificationsToSend = [];

        equipment.forEach(item => {
            const { id, name, cycle, current_value, last_maint_date, last_maint_value } = item;
            const cycleValue = parseInt(cycle, 10);
            const currentValue = parseInt(current_value, 10);

            const difference = cycleValue - currentValue;

            console.log(`Equipment: ${name}, Current Value: ${currentValue}, Cycle Value: ${cycleValue}, Difference: ${difference}`);

            // Define thresholds for triggering notifications
            const notificationThresholds = [10, 15, 20]; // Add or adjust thresholds as needed

            notificationThresholds.forEach(threshold => {
                // Check if the difference is less than or equal to the threshold
                if (difference <= threshold) {
                    const notificationMessage = `The current value of equipment "${name}" is close to its cycle value. Current Value: ${currentValue}, Cycle Value: ${cycleValue}`;
                    notificationsToSend.push({ id, name, cycle, current_value, last_maint_date, notificationMessage });
                }
            });

            // Check if the current value exceeds or equals the cycle value
            if (currentValue >= cycleValue) {
                const notificationMessage = `The current value of equipment "${name}" has reached or exceeded its cycle value. Current Value: ${currentValue}, Cycle Value: ${cycleValue}`;
                notificationsToSend.push({ id, name, cycle, current_value, last_maint_date, notificationMessage });
            }
        });

        console.log("Notifications generated:", notificationsToSend);

        res.status(200).json({
            status: "success",
            data: {
                notificationsprev: notificationsToSend,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifications_prev endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});
*/


app.get("/api/v1/notifications_prev", async (req, res) => {
    try {
        const { rows: equipment } = await db.query("SELECT id, name, cycle, current_value, last_maint_date, last_maint_value FROM equipement WHERE (type = 'produit' OR type = 'Produit') AND deleted = false");

        const notificationsToSend = [];

        equipment.forEach(item => {
            const { id, name, cycle, current_value, last_maint_date, last_maint_value } = item;
            const cycleValue = parseInt(cycle, 10);
            const currentValue = parseInt(current_value, 10);

            const difference = cycleValue - currentValue;

            console.log(`Equipment: ${name}, Current Value: ${currentValue}, Cycle Value: ${cycleValue}, Difference: ${difference}`);

            // Define thresholds for triggering notifications
            const notificationThresholds = [10, 15, 20]; // Add or adjust thresholds as needed

            notificationThresholds.forEach(threshold => {
                // Check if the difference is less than or equal to the threshold
                if (difference <= threshold) {
                    const notificationMessage = `The current value of equipment "${name}" is close to its cycle value. Current Value: ${currentValue}, Cycle Value: ${cycleValue}`;
                    notificationsToSend.push({ id, name, cycle, current_value, last_maint_date, notificationMessage });
                }
            });

            // Check if the current value exceeds or equals the cycle value
            if (currentValue >= cycleValue) {
                const notificationMessage = `The current value of equipment "${name}" has reached or exceeded its cycle value. Current Value: ${currentValue}, Cycle Value: ${cycleValue}`;
                notificationsToSend.push({ id, name, cycle, current_value, last_maint_date, notificationMessage });
            }
        });

        console.log("Notifications generated:", notificationsToSend);

        // Insert notifications into the notifprev table
        for (const notification of notificationsToSend) {
            const state = "En attente..."; 
            await db.query("INSERT INTO notifprev (id,name, current_value, cycle, last_maint_value, last_maint_date,state) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
                           [notification.id, notification.name, notification.current_value, notification.cycle, notification.last_maint_value, notification.last_maint_date, state]);
        }

        res.status(200).json({
            status: "success",
            data: {
                notificationsprev: notificationsToSend,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifications_prev endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/notifprev", async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM notifprev');
        res.status(200).json({
            status: "success",
            data: {
                notifprev: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprev endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/notifprevunique", async (req, res) => {
    try {
        const results = await db.query('SELECT DISTINCT ON (current_value) * FROM notifprev WHERE technicien_id IS NULL');
        res.status(200).json({
            status: "success",
            data: {
                notifprevunique: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprev endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

/********* the affecter doesn't appear 
app.get("/api/v1/notifprevunique", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT *
            FROM notifprev
            WHERE affecter IS NULL
            ORDER BY current_value DESC
            LIMIT 1
        `);
        res.status(200).json({
            status: "success",
            data: {
                notifprevunique: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevunique endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});
*/

app.get("/api/v1/notifprevunique/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Check if the id is provided and is a number
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        const results = await db.query('SELECT DISTINCT ON (current_value) * FROM notifprev WHERE id = $1', [id]);

        // Check if the record exists
        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                notifprevunique: results.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevunique/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.put("/api/v1/notifprevunique/:id", async (req, res) => {
    const { id } = req.params;
    const { technicien_id } = req.body; // Only update technicien_id
    try {
        // Check if the id is provided and is a number
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        // Check if technicien_id is provided and is a number
        if (!technicien_id || isNaN(technicien_id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid or missing technicien_id for update",
            });
        }

        // Construct SQL query to update the technicien_id and set the state to "En attente..." of the record with the provided id
        const updateQuery = `
            UPDATE notifprev
            SET technicien_id = $2, state = 'En attente...'
            WHERE id = $1
            RETURNING *;`;

        const values = [id, technicien_id];

        const result = await db.query(updateQuery, values);

        // Check if the record exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                updatedRecord: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in PUT /api/v1/notifprevunique/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});





/************************************************************************************************************Notifprev composant */

// Endpoint for fetching notifications for previous components
app.get("/api/v1/notifications_prevcomp", async (req, res) => {
    try {
        // Fetch components that are products and not deleted
        const { rows: components } = await db.query("SELECT id, name_equip, name_comp, cycle, current_value, last_maint_date, last_maint_value FROM composant WHERE (type = 'produit' OR type = 'Produit') AND deleted = false");

        const notificationsToSend = [];

        components.forEach(component => {
            const { id, name_equip, name_comp, cycle, current_value, last_maint_date, last_maint_value } = component;

            const cycleValue = parseInt(cycle, 10);
            const lastmaintvalue = parseInt(last_maint_value, 10);
            const currentvalue = parseInt(current_value, 10);
            const nextmaintvalue = cycleValue + lastmaintvalue;

            console.log(`Component: ${name_comp}, lastmaintvalue: ${lastmaintvalue}, Cycle Value: ${cycleValue}, nextmaintvalue: ${nextmaintvalue}`);

            // Define thresholds for triggering notifications
            const notificationThresholds = [5, 15, 20]; // Add or adjust thresholds as needed

            notificationThresholds.forEach(threshold => {
                if (nextmaintvalue - currentvalue <= threshold && nextmaintvalue > currentvalue) {
                    const notificationMessage = `The current value of component "${name_comp}" is close to its cycle value. Current Value: ${currentvalue}, Cycle Value: ${cycleValue}`;
                    notificationsToSend.push({ id, name_equip, name_comp, cycle, current_value: currentvalue, last_maint_value: lastmaintvalue, last_maint_date, notificationMessage });
                }
            });

            // Check if the current value exceeds or equals the cycle value
            if (currentvalue >= nextmaintvalue) {
                const notificationMessage = `The current value of component "${name_comp}" has reached or exceeded its cycle value. Current Value: ${currentvalue}, nextmaintvalue: ${nextmaintvalue}`;
                notificationsToSend.push({ id, name_equip, name_comp, cycle, current_value: currentvalue, last_maint_value: lastmaintvalue, last_maint_date, notificationMessage });
            }
        });

        console.log("Notifications generated:", notificationsToSend);

        // Insert notifications into the notifprevcomp table
        for (const notification of notificationsToSend) {
            const state = "En attente..."; // Use consistent state terminology
            await db.query("INSERT INTO notifprevcomp (id, name_equip, name_comp, current_value, cycle, last_maint_value, last_maint_date, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", 
                           [notification.id, notification.name_equip, notification.name_comp, notification.current_value, notification.cycle, notification.last_maint_value, notification.last_maint_date, state]);
        }

        res.status(200).json({
            status: "success",
            data: {
                notificationsprev: notificationsToSend,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifications_prevcomp endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


// Endpoint for fetching all notifications from notifprevcomp table
app.get("/api/v1/notifprevcomp", async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM notifprevcomp');
        res.status(200).json({
            status: "success",
            data: {
                notifprevcomp: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevcomp endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

// Endpoint for fetching unique notifications based on current_value from notifprevcomp table
app.get("/api/v1/notifprevcompunique", async (req, res) => {
    try {
        // Select distinct rows based on current_value and filter out rows where state is 'terminée'
        const results = await db.query(`
            SELECT DISTINCT ON (current_value) *
            FROM notifprevcomp
            WHERE state != 'terminée'
            ORDER BY current_value, last_maint_date DESC
        `);
        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevcompunique endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/notifprevcompuniquetech", async (req, res) => {
    try {
        // Select distinct rows based on current_value and filter out rows where state is 'terminée'
        const results = await db.query(`
            SELECT DISTINCT ON (current_value) *
            FROM notifprevcomp
            WHERE state != 'Terminée'
            ORDER BY current_value, last_maint_date DESC
        `);
        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevcompunique endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


// Endpoint for fetching unique notification based on current_value and id from notifprevcomp table
app.get("/api/v1/notifprevcompunique/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Validate id parameter
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        const results = await db.query('SELECT DISTINCT ON (current_value) * FROM notifprevcomp WHERE id = $1', [id]);

        // Check if record exists
        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique: results.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifprevcompunique/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

// Endpoint for updating technicien_id and state of a unique notification in notifprevcomp table
app.put("/api/v1/notifprevcompunique/:id", async (req, res) => {
    const { id } = req.params;
    const { technicien_id } = req.body;
    try {
        // Validate id parameter
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        // Validate technicien_id parameter
        if (!technicien_id || isNaN(technicien_id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid or missing technicien_id for update",
            });
        }

            // Update technicien_id and state of the notification with the provided id
            const updateQuery = `
            UPDATE notifprevcomp
            SET technicien_id = $2, state = 'En attente..."'
            WHERE id = $1
            RETURNING *;`;

        const values = [id, technicien_id];

        const result = await db.query(updateQuery, values);

        // Check if the record exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                updatedRecord: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in PUT /api/v1/notifprevcompunique/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});




/*
//////////////*************** notifemployee_admin terminée*/
/*
app.get("/api/v1/notifempadm", async (req, res) => {
    try {
        const notifprevQuery = `
            SELECT DISTINCT ON (name, state) name, state 
            FROM notifprev 
            WHERE state = 'Terminée';
        `;
        const maintenancePrevQuery = `
            SELECT name, state 
            FROM maintenance_prev 
            WHERE state = 'Terminée';
        `;
        const reclamationQuery = `
            SELECT ref AS name, state 
            FROM reclamation 
            WHERE state = 'Terminée' AND deleted = false;
        `;

        const { rows: notifprev } = await db.query(notifprevQuery);
        const { rows: maintenancePrev } = await db.query(maintenancePrevQuery);
        const { rows: reclamation } = await db.query(reclamationQuery);

        res.status(200).json({
            status: "success",
            data: {
                notifprev,
                maintenancePrev,
                reclamation,
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/notifempadm endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
*/
app.get("/api/v1/notifempadm", async (req, res) => {
    try {
        const notifprevQuery = `
            SELECT DISTINCT ON (id) id, name, state 
            FROM notifprev 
            WHERE state = 'Terminée';
        `;
        const maintenancePrevQuery = `
            SELECT id, name, state 
            FROM maintenance_prev 
            WHERE state = 'Terminée';
        `;
        const reclamationQuery = `
            SELECT reclamation.ref AS name, reclamation.state, equipement.id, equipement.name AS equipement_name
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            WHERE reclamation.state = 'Terminée' AND reclamation.deleted = false;
        `;

        const { rows: notifprev } = await db.query(notifprevQuery);
        const { rows: maintenancePrev } = await db.query(maintenancePrevQuery);
        const { rows: reclamation } = await db.query(reclamationQuery);

        const combinedResults = [
            ...notifprev,
            ...maintenancePrev,
            ...reclamation
        ];

        res.status(200).json({
            status: "success",
            notifemp: combinedResults
        });
    } catch (err) {
        console.error('Error in /api/v1/notifempadm endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

///**notifprevcomp admin */

//////************************historique des maintenance */

/* 
app.get("/api/v1/historiquemaint", async (req, res) => {
    try {
        const notifprevQuery = `
            SELECT DISTINCT ON (notifprev.id) 
                notifprev.id, 
                notifprev.name, 
                notifprev.state, 
                notifprev.last_maint_date,  
                technicien.name AS technicien_name 
            FROM notifprev 
            LEFT JOIN technicien ON notifprev.technicien_id = technicien.id
            WHERE notifprev.state = 'Terminée' AND technicien.name IS NOT NULL;
        `;

        const maintenancePrevQuery = `
            SELECT 
                maintenance_prev.id, 
                maintenance_prev.name, 
                maintenance_prev.state, 
                maintenance_prev.last_maint_date, 
                technicien.name AS technicien_name 
            FROM maintenance_prev 
            LEFT JOIN technicien ON maintenance_prev.technicien_id = technicien.id
            WHERE maintenance_prev.state = 'Terminée' AND technicien.name IS NOT NULL;
        `;

        const reclamationQuery = `
            SELECT 
               
                reclamation.state, 
                equipement.last_maint_date,
                equipement.last_maint_date AS equipement_last_maint_date,
                equipement.id, 
                equipement.name AS name, 
                technicien.name AS technicien_name 
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            LEFT JOIN technicien ON reclamation.technicien_id = technicien.id
            WHERE reclamation.state = 'Terminée' AND reclamation.deleted = false AND technicien.name IS NOT NULL;
        `;

        const { rows: notifprev } = await db.query(notifprevQuery);
        const { rows: maintenancePrev } = await db.query(maintenancePrevQuery);
        const { rows: reclamation } = await db.query(reclamationQuery);

        const combinedResults = [
            ...notifprev,
            ...maintenancePrev,
            ...reclamation
        ];

        res.status(200).json({
            status: "success",
            data: {
               historique: combinedResults
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/historiquemaint endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
*/

app.get("/api/v1/historiquemaint", async (req, res) => {
    try {
        const notifprevQuery = `
            SELECT DISTINCT ON (notifprev.id) 
                notifprev.id, 
                notifprev.name, 
                notifprev.state, 
                notifprev.last_maint_date,  
                technicien.name AS technicien_name,
                technicien.id AS technicien_id
            FROM notifprev 
            LEFT JOIN technicien ON notifprev.technicien_id = technicien.id
            WHERE notifprev.state = 'Terminée' 
            AND technicien.name IS NOT NULL
            AND notifprev.last_maint_date IS NOT NULL;
        `;

        const maintenancePrevQuery = `
            SELECT 
                maintenance_prev.id, 
                maintenance_prev.name, 
                maintenance_prev.state, 
                maintenance_prev.last_maint_date, 
                technicien.name AS technicien_name,
                technicien.id AS technicien_id
            FROM maintenance_prev 
            LEFT JOIN technicien ON maintenance_prev.technicien_id = technicien.id
            WHERE maintenance_prev.state = 'Terminée' 
            AND technicien.name IS NOT NULL
            AND maintenance_prev.last_maint_date IS NOT NULL;
        `;

        const reclamationQuery = `
            SELECT 
                reclamation.state, 
                equipement.last_maint_date,
                equipement.last_maint_date AS equipement_last_maint_date,
                equipement.id, 
                equipement.name AS name, 
                technicien.name AS technicien_name,
                technicien.id AS technicien_id
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            LEFT JOIN technicien ON reclamation.technicien_id = technicien.id
            WHERE reclamation.state = 'Terminée' 
            AND reclamation.deleted = false 
            AND technicien.name IS NOT NULL
            AND equipement.last_maint_date IS NOT NULL;
        `;

        const { rows: notifprev } = await db.query(notifprevQuery);
        const { rows: maintenancePrev } = await db.query(maintenancePrevQuery);
        const { rows: reclamation } = await db.query(reclamationQuery);

        const combinedResults = [
            ...notifprev,
            ...maintenancePrev,
            ...reclamation
        ];

        for (const result of combinedResults) {
            const insertQuery = `
                INSERT INTO historique (id, name, state, last_maint_date, technicien_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING;
            `;
            const values = [result.id, result.name, result.state, result.last_maint_date, result.technicien_id];
            await db.query(insertQuery, values);
        }

        res.status(200).json({
            status: "success",
            data: {
                historique: combinedResults
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/historiquemaint endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
app.get("/api/v1/historiqueterm", async (req, res) => {
    try {
        const query = `
            SELECT h.id, h.name, h.state, h.last_maint_date, h.technicien_id, h.id_hist,
                   t.name AS technicien_name,
                   t.id AS technicien_id
            FROM historique h
            LEFT JOIN technicien t ON h.technicien_id = t.id
            WHERE h.id IS NOT NULL
           
        `;
        
        const { rows } = await db.query(query);

        res.status(200).json({
            status: "success",
            data: {
                historique: rows
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/historiqueterm endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});



//////////////////////////delete state terminée
cron.schedule('0 0 */2 * *', async () => {
    try {
        await db.query("DELETE FROM notifprev WHERE state = 'Terminée'");
        await db.query("DELETE FROM maintenance_prev WHERE state = 'Terminée'");
        await db.query("DELETE FROM reclamation WHERE state = 'Terminée'");
        console.log('Deleted records with state "Terminée"');
    } catch (error) {
        console.error('Error deleting records with state "Terminée":', error);
    }
});

////////////// historique reclamation*/
app.get("/api/v1/historiquerec", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
                reclamation.priority,
                reclamation.created_by,
                equipement.name AS equipment_name,
                employee.firstname AS responsible_name,
                technicien.name AS technicien_name 
            FROM reclamation 
            LEFT JOIN equipement ON reclamation.equipement_id = equipement.id
            LEFT JOIN employee ON reclamation.responsible = employee.id
            LEFT JOIN technicien ON reclamation.technicien_id = technicien.id
            WHERE reclamation.deleted = false AND technicien.name IS NOT NULL;
        `);
        const equipments = await db.query("SELECT id, name FROM equipement WHERE deleted = false");
        const employees = await db.query("SELECT id, firstname FROM employee WHERE deleted = false");
        const techniciens = await db.query("SELECT id, name FROM technicien WHERE deleted = false");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                reclamations: results.rows,
                equipments: equipments.rows,
                employees: employees.rows,
                techniciens: techniciens.rows
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



//////////////*************** notifprevunique technicien*/
app.get("/api/v1/notifprevuniquetech/:technicien_id", async (req, res) => {
    try {
        const { rows: notifprevunique } = await db.query(
            `SELECT DISTINCT ON (name) 
             * FROM notifprev 
             WHERE technicien_id = $1 AND state != 'Terminée'
             ORDER BY name, current_value DESC`,
            [req.params.technicien_id]
        );

        const { rows: techniciens } = await db.query(
            "SELECT * FROM technicien WHERE id = $1",
            [req.params.technicien_id]
        );
      
        res.status(200).json({
            status: "success",
            data: {
                notifprevunique: notifprevunique,
                techniciens: techniciens,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});


/****for comp tech */

app.get("/api/v1/notifprevcompuniquetech/:technicien_id", async (req, res) => {
    try {
        const { rows: notifprevcompunique } = await db.query(
            `SELECT DISTINCT ON (name_equip, name_comp, current_value, cycle, last_maint_value, last_maint_date, state) 
             * FROM notifprevcomp 
             WHERE technicien_id = $1 AND state != 'Terminée'`,
            [req.params.technicien_id]
        );

        const { rows: techniciens } = await db.query(
            "SELECT * FROM technicien WHERE id = $1",
            [req.params.technicien_id]
        );
      
        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique: notifprevcompunique,
                techniciens: techniciens,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

app.get("/api/v1/notifprevuniquetechemployee", async (req, res) => {
    try {
        const { rows: notifprevunique } = await db.query(
            `SELECT DISTINCT ON (name,  state) 
             * 
             FROM notifprev 
             WHERE state = 'Terminée'`
        );

        res.status(200).json({
            status: "success",
            data: {
                notifprevunique
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/notifprevuniquetechemployee endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
/********comp employee */
app.get("/api/v1/notifprevcompuniquetechemployee", async (req, res) => {
    try {
        const { rows: notifprevcompunique } = await db.query(
            `SELECT DISTINCT ON (name_equip, name_comp, state) 
             * 
             FROM notifprevcomp 
             WHERE state = 'Terminée'`
        );

        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique
            }
        });
    } catch (err) {
        console.error('Error in /api/v1/notifprevuniquetechemployee endpoint:', err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

app.get("/api/v1/notifprevuniquestate/:id", async (req, res) => {
    try {
        const { rows: notifprevunique } = await db.query(
            `SELECT DISTINCT ON (name) 
             state FROM notifprev 
             WHERE id = $1`,
            [req.params.id]
        );
      
        res.status(200).json({
            status: "success",
            data: {
                notifprevunique: notifprevunique,
               
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});


app.get("/api/v1/notifprevcompuniquestate/:id", async (req, res) => {
    try {
        const { rows: notifprevcompunique } = await db.query(
            `SELECT DISTINCT ON (name_equip) 
             state FROM notifprevcomp
             WHERE id = $1`,
            [req.params.id]
        );

       
      
        res.status(200).json({
            status: "success",
            data: {
                notifprevcompunique: notifprevcompunique,
               
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});
////////////************************ par periode */
app.get("/api/v1/notifications_prevperiode", async (req, res) => {
    try {
        const { rows: equipment } = await db.query("SELECT id, name, cycle, last_maint_date, unit_id, technicien_id FROM equipement WHERE (type = 'periode' OR type = 'Periode') AND deleted = false");

        const notificationsToSend = [];

        for (const item of equipment) {
            const { id, name, cycle, last_maint_date, unit_id, technicien_id } = item;
            const { rows: unitInfo } = await db.query("SELECT unit FROM unit WHERE id = $1", [unit_id]);
            const unit = unitInfo[0].unit.toLowerCase();

            // Parse the last maintenance date into a Date object
            const lastMaintDateTime = new Date(last_maint_date);

            let nextMaintDateTime = new Date(lastMaintDateTime); // Make a copy of lastMaintDateTime

            switch (unit) {
                case 'seconde':
                    nextMaintDateTime.setSeconds(nextMaintDateTime.getSeconds() + parseInt(cycle, 10));
                    break;
                case 'minute':
                    nextMaintDateTime.setMinutes(nextMaintDateTime.getMinutes() + parseInt(cycle, 10));
                    break;
                case 'heure':
                    nextMaintDateTime.setHours(nextMaintDateTime.getHours() + parseInt(cycle, 10));
                    break;
                case 'jours':
                    nextMaintDateTime.setDate(nextMaintDateTime.getDate() + parseInt(cycle, 10));
                    break;
                default:
                    throw new Error(`Invalid unit: ${unit}`);
            }

            const state = "En attente...";

            // Insert into maintenance_prev table
            await db.query(
                `
                INSERT INTO maintenance_prev 
                    (id, name, current_value, cycle, last_maint_value, last_maint_date, unit, next_maint_date, technicien_id, state) 
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE
                SET 
                    name = EXCLUDED.name,
                    current_value = EXCLUDED.current_value,
                    cycle = EXCLUDED.cycle,
                    last_maint_value = EXCLUDED.last_maint_value,
                    last_maint_date = EXCLUDED.last_maint_date,
                    unit = EXCLUDED.unit,
                    next_maint_date = EXCLUDED.next_maint_date,
                    technicien_id = EXCLUDED.technicien_id,
                    state = EXCLUDED.state
                `,
                [
                    id,
                    name,
                    null,
                    cycle,
                    null,
                    lastMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                    unit,
                    nextMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                    technicien_id,
                    state
                ]
            );

            notificationsToSend.push({
                id,
                name,
                last_maint_date: lastMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                cycle,
                unit,
                next_maint_date: nextMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                state,
                message: `You have a preventive maintenance scheduled by period for equipment "${name}"`,
            });

            console.log(`Notification sent for equipment "${name}"`);
        }

        res.status(200).json({
            status: "success",
            data: {
                notificationsperiode: notificationsToSend,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifications_prevperiode endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



function getReminderTime(unit) {
    switch (unit) {
        case 'seconde':
            return 1; // 1 second
        case 'minute':
            return 30; // 30 seconds
        case 'heure':
            return 360; // 6 minutes (360 seconds)
        case 'jours':
            return 14400; // 4 hours (14400 seconds)
        default:
            throw new Error(`Invalid unit: ${unit}`);
    }
}

app.get("/api/v1/maintenance_prev", async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM maintenance_prev WHERE technicien_id IS NULL');
            res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prev endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.get("/api/v1/maintenance_prev/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Check if the id is provided and is a number
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        const results = await db.query('SELECT * FROM maintenance_prev WHERE id = $1', [id]);

        // Check if the record exists
        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: results.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prev/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.put("/api/v1/maintenance_prev/:id", async (req, res) => {
    const { id } = req.params;
    const { technicien_id } = req.body;

    // Check if the id is provided and is a number
    if (!id || isNaN(id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Update the record in the database
        const result = await db.query(
            "UPDATE maintenance_prev SET technicien_id = $1 WHERE id = $2 RETURNING *",
            [technicien_id, id]
        );

        // Check if the record was found and updated
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prev/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/maintenance_prevtech/:technicien_id", async (req, res) => {
    const { technicien_id } = req.params;

    // Check if the id is provided and is a number
    if (!technicien_id || isNaN(technicien_id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Fetch the records from the database for the given technicien_id
        const result = await db.query(
            "SELECT * FROM maintenance_prev WHERE technicien_id = $1 AND state != 'Terminée'",
            [technicien_id]
        );

        // Check if any records were found
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No records found for this technicien_id",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prev/:technicien_id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/maintenance_prevtechemployee", async (req, res) => {
    try {
        // Fetch the records from the database where state is 'Terminée'
        const result = await db.query(
            "SELECT * FROM maintenance_prev WHERE state = 'Terminée'"
        );

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevtechemployee endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});




app.get("/api/v1/maintenance_prevstate/:id", async (req, res) => {
    const { id } = req.params;

    // Check if the id is provided and is a number
    if (!id || isNaN(id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Fetch the records from the database for the given technicien_id
        const result = await db.query(
            "SELECT state FROM maintenance_prev WHERE id = $1",
            [id]
        );

        // Check if any records were found
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No records found for this id",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prev: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prev/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


/********************************************************************************************************** maintenance_prevcomp */
// Assuming this part is unchanged
app.get("/api/v1/notifications_prevcompperiode", async (req, res) => {
    try {
        const { rows: composant } = await db.query("SELECT id, name_equip, name_comp, cycle, last_maint_date, unit_id, technicien_id FROM composant WHERE (type = 'periode' OR type = 'Periode') AND deleted = false");

        const notificationsToSend = [];

        for (const item of composant) {
            const { id, name_equip, name_comp, cycle, last_maint_date, unit_id, technicien_id } = item;
            const { rows: unitInfo } = await db.query("SELECT unit FROM unit WHERE id = $1", [unit_id]);
            const unit = unitInfo[0].unit.toLowerCase();

            // Parse the last maintenance date into a Date object
            const lastMaintDateTime = new Date(last_maint_date);
            const reminderTimeInSeconds = getReminderTime(unit);

            let nextMaintDateTime = new Date(lastMaintDateTime); // Make a copy of lastMaintDateTime
            nextMaintDateTime.setSeconds(nextMaintDateTime.getSeconds() + parseInt(cycle, 10));

            const state = "En attente...";

            // Insert into maintenance_prevcomp table
            await db.query(
                `
                INSERT INTO maintenance_prevcomp 
                    (id, name_equip, name_comp, current_value, cycle, last_maint_value, last_maint_date, unit, next_maint_date, technicien_id, state) 
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO UPDATE
                SET 
                    name_equip = EXCLUDED.name_equip,
                    name_comp = EXCLUDED.name_comp,
                    current_value = EXCLUDED.current_value,
                    cycle = EXCLUDED.cycle,
                    last_maint_value = EXCLUDED.last_maint_value,
                    last_maint_date = EXCLUDED.last_maint_date,
                    unit = EXCLUDED.unit,
                    next_maint_date = EXCLUDED.next_maint_date,
                    technicien_id = EXCLUDED.technicien_id,
                    state = EXCLUDED.state
                `,
                [
                    id,
                    name_equip,
                    name_comp,
                    null,
                    cycle,
                    null,
                    lastMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                    unit,
                    nextMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                    technicien_id,
                    state
                ]
            );

            notificationsToSend.push({
                id,
                name_equip,
                name_comp,
                last_maint_date: lastMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                cycle,
                unit,
                next_maint_date: nextMaintDateTime.toISOString().replace('T', ' ').replace('Z', ''), // Convert to desired format
                state,
                message: `You have a preventive maintenance scheduled by period for component "${name_comp}"`,
                reminder_time: reminderTimeInSeconds,
            });

            console.log(`Notification sent for component "${name_comp}"`);
        }

        res.status(200).json({
            status: "success",
            data: {
                notificationsperiode: notificationsToSend,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/notifications_prevcompperiode endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

// Function to get reminder time remains unchanged
function getReminderTime(unit) {
    switch (unit) {
        case 'seconde':
            return 1; // 1 second
        case 'minute':
            return 30; // 30 seconds
        case 'heure':
            return 360; // 6 minutes (360 seconds)
        case 'jours':
            return 14400; // 4 hours (14400 seconds)
        default:
            throw new Error(`Invalid unit: ${unit}`);
    }
}


app.get("/api/v1/maintenance_prevcomp", async (req, res) => {
    try {
        const results = await db.query('SELECT * FROM maintenance_prevcomp');
        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: results.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomp endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.get("/api/v1/maintenance_prevcomp/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Check if the id is provided and is a number
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid ID parameter",
            });
        }

        const results = await db.query('SELECT * FROM maintenance_prevcomp WHERE id = $1', [id]);

        // Check if the record exists
        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: results.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomp/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.put("/api/v1/maintenance_prevcomp/:id", async (req, res) => {
    const { id } = req.params;
    const { technicien_id } = req.body;

    // Check if the id is provided and is a number
    if (!id || isNaN(id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Update the record in the database
        const result = await db.query(
            "UPDATE maintenance_prevcomp SET technicien_id = $1 WHERE id = $2 RETURNING *",
            [technicien_id, id]
        );

        // Check if the record was found and updated
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomp/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});



app.get("/api/v1/maintenance_prevcomptech/:technicien_id", async (req, res) => {
    const { technicien_id } = req.params;

    // Check if the id is provided and is a number
    if (!technicien_id || isNaN(technicien_id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Fetch the records from the database for the given technicien_id
        const result = await db.query(
            "SELECT * FROM maintenance_prevcomp WHERE technicien_id = $1 AND state != 'Terminée'",
            [technicien_id]
        );

        // Check if any records were found
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No records found for this technicien_id",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomp/:technicien_id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/maintenance_prevcomptechemployee", async (req, res) => {
    try {
        // Fetch the records from the database where state is 'Terminée'
        const result = await db.query(
            "SELECT * FROM maintenance_prevcomp WHERE state = 'Terminée'"
        );

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomptechemployee endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});




app.get("/api/v1/maintenance_prevcompstate/:id", async (req, res) => {
    const { id } = req.params;

    // Check if the id is provided and is a number
    if (!id || isNaN(id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Fetch the records from the database for the given technicien_id
        const result = await db.query(
            "SELECT state FROM maintenance_prevcomp WHERE id = $1",
            [id]
        );

        // Check if any records were found
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No records found for this id",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                maintenance_prevcomp: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/maintenance_prevcomp/:id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/api/v1/reclamationstate/:id", async (req, res) => {
    const { id } = req.params;

    // Check if the id is provided and is a number
    if (!id || isNaN(id)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid ID parameter",
        });
    }

    try {
        // Fetch the records from the database for the given technicien_id
        const result = await db.query(
            "SELECT distinct on (id) state FROM reclamation WHERE id = $1",
            [id]
        );

        // Check if any records were found
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No records found for this id",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                reclamation: result.rows,
            },
        });
    } catch (error) {
        console.error('Error in /api/v1/reclamation/:equipement_id endpoint:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


/***************************** gerer mainetnance */
app.put("/api/v1/state/:id", async (req, res) => {
    const { equipement_id, id, state } = req.body;
  
    try {
      if (!state) {
        return res.status(400).json({
          status: "error",
          message: "State parameter is missing",
        });
      }
  
      // Update state in reclamation class
      if (equipement_id) {
        await db.query("UPDATE reclamation SET state = $1 WHERE equipement_id = $2", [state, equipement_id]);
      }
  
      // Update state in notifprev class
      if (id) {
        await db.query("UPDATE notifprev SET state = $1 WHERE id = $2", [state, id]);
      }
  
      // Update state in maintenance_prev class
      if (id) {
        await db.query("UPDATE maintenance_prev SET state = $1 WHERE id = $2", [state, id]);
      }
  
      res.status(200).json({
        status: "success",
        message: "State updated successfully in all classes",
      });
    } catch (error) {
      console.error('Error updating state:', error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  });
  
////////////*********state composant */
app.put("/api/v1/statecomp/:id", async (req, res) => {
    const { composant_id, id, state } = req.body;
  
    if (!state) {
      return res.status(400).json({
        status: "error",
        message: "State parameter is missing",
      });
    }
  
    try {
      await db.query('BEGIN');
  
      // Update state in reclamation class
      if (composant_id) {
        await db.query("UPDATE reclamation SET state = $1 WHERE composant_id = $2", [state, composant_id]);
      }
  
      // Update state in notifprev class
      if (id) {
        await db.query("UPDATE notifprevcomp SET state = $1 WHERE id = $2", [state, id]);
      }
  
      // Update state in maintenance_prev class
      if (id) {
        await db.query("UPDATE maintenance_prevcomp SET state = $1 WHERE id = $2", [state, id]);
      }
  
      await db.query('COMMIT');
  
      res.status(200).json({
        status: "success",
        message: "State updated successfully in all classes",
      });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error updating state:', error);
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




///////////******************* */
app.get("/api/v1/login", async (req, res) => {
    try {
        const results = await db.query("select * from users");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                users: results.rows,
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



app.post('/api/v1/login', async (req, res) => {
    const { userid, password } = req.body;
    try {
        // Check if the user exists in the database
        const users = await db.query("SELECT * FROM users WHERE userid = $1", [userid]);

        if (users.rows.length > 0) {
            // User exists, now compare passwords
            const storedPassword = String(users.rows[0].password ?? "");
            const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);
            const passwordMatches = isBcryptHash
                ? await bcrypt.compare(String(password ?? ""), storedPassword)
                : String(password ?? "") === storedPassword;

            if (passwordMatches) {
                // Passwords match, generate JWT token
                const { id, name, role, login_count } = users.rows[0];
                const token = jwt.sign({ id, name, role }, process.env.JWT_SECRET, { expiresIn: '6h' });

                // Use secure cookies over HTTPS; local Docker development uses HTTP.
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.COOKIE_SECURE === 'true',
                    sameSite: 'strict'
                });

                // Update last_login time
                const now = moment().toDate();  // Get the current time using moment
                await db.query("UPDATE users SET last_login = $1 WHERE id = $2", [now, id]);

                // Increment login count
                await db.query("UPDATE users SET login_count = login_count + 1 WHERE id = $1", [id]);

                // Respond with success message
                if (login_count === 0) {
                    return res.json({ status: "success", isFirstLogin: true });
                }
                return res.json({ status: "success", isFirstLogin: false });
            } else {
                // Incorrect password
                return res.status(401).json({ message: "Incorrect password" });
            }
        } else {
            // User not found
            return res.status(401).json({ message: "User not found" });
        }
    } catch (err) {
        // Handle database errors
        console.error("Database error:", err); // Log the error for debugging
        return res.status(503).json({
            message: "Database unavailable. Check the PostgreSQL settings in server/.env.",
        });
    }
});

/*
app.put("/api/v1/users", async (req, res) =>{
    try {
        const token = req.cookies.token; // Retrieve JWT token from cookies
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode JWT token
        const userId = decoded.id; // Extract user ID from decoded token
        
        const results = await db.query(
            "UPDATE users SET userid = $1, password = $2 WHERE id = $3 RETURNING *",
            
            [
                req.body.userid,
                req.body.password,
                userId // Use authenticated user's ID for the update
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                users: results.rows[0],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});*/

app.put("/api/v1/users",  async (req, res) => {
    try {
        const token = req.cookies.token; // Retrieve JWT token from cookies
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode JWT token
        const userId = decoded.id; // Extract user ID from decoded token

        // Update the users table
        const userUpdateResults = await db.query(
            "UPDATE users SET userid = $1, password = $2 WHERE id = $3 RETURNING *",
            [
                req.body.userid,
                req.body.password,
                userId // Use authenticated user's ID for the update
            ]
        );

        // Update the employee table
        const employeeUpdateResults = await db.query(
            "UPDATE employee SET phone = $1, job_title = $2, email = $3 WHERE userid = $4 RETURNING *",
            [
                req.body.phone,
                req.body.job_title,
                req.body.email,
                userUpdateResults.rows[0].userid // Use updated userid from the users table
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                user: userUpdateResults.rows[0],
                employee: employeeUpdateResults.rows[0]
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


app.get("/api/v1/users", async (req, res) => {
    try {
        const token = req.cookies.token; // Retrieve JWT token from cookies
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode JWT token
        const userId = decoded.id; // Extract user ID from decoded token
        const results = await db.query(
            "SELECT * FROM users WHERE id = $1",
            [userId]
        );

        res.status(200).json({
            status: "success",
            data: {
                users: results.rows[0], // Fix the variable name from 'users' to 'results'
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



app.get("/api/v1/user", async (req, res) => {
    try {
        const results = await db.query("select * from users");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                users: results.rows,
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

app.get("/api/v1/user/:id", async (req, res) => {
    try {
        const userId = req.params.id; // Récupérer l'ID de la requête
        const results = await db.query("SELECT * FROM users WHERE id = $1 AND deleted = false", [userId]); // Utiliser l'ID dans la requête SQL
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                users: results.rows,
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

app.get("/api/v1/logout", (req, res) => {
    res.clearCookie("token");
    return res.json({ Status: 'Success' });
});



/*****************Nom et logo societe */


// Routes for nomlogo
app.get("/api/v1/nomlogo", async (req, res) => {
    try {
        const results = await db.query(`
          select * from nomlogo;
        `);

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                nomlogo: results.rows,
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

app.get("/api/v1/nomlogo/:id", async (req, res) => {
    try {
        const nomlogo = await db.query(
            "SELECT * FROM nomlogo WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                nomlogo: nomlogo.rows[0],
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



app.post("/api/v1/nomlogo", upload.single('image'), async (req, res) => {
    try {
        // Extract the file path from the request
        const imagePath = req.file ? req.file.path : null;

      
    
  
    
        // Execute the database query
        const results = await db.query(
            "INSERT INTO nomlogo (name, image) VALUES ($1, $2) RETURNING *",
            [
                req.body.name,
             
                imagePath, // Use file path here
                
            ]
        );
        // Send the response with the inserted data
        res.status(201).json({
            status: "success",
            data: {
                nomlogo: results.rows[0],
            },
        });
    } catch (err) {
        // Handle any errors
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});


app.put("/api/v1/nomlogo/:id", upload.single('image'), async (req, res) => {
    try {
        let imagePath = req.body.image; // Get the existing image path from the request body
        if (req.file) {
            imagePath = req.file.path; // If a new image is uploaded, update the image path
        }

        const results = await db.query(
            "UPDATE nomlogo SET name = $1, image =$2 WHERE id = $3 RETURNING *",
            [
                req.body.name,
                imagePath, // Use file path here
              
                req.params.id
            ]
        );

        res.status(200).json({
            status: "success",
            data: {
                nomlogo: results.rows[0],
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


app.delete("/api/v1/nomlogo/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM nomlogo WHERE id = $1", [req.params.id]);
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

//////////****************************** */

// Add this route to your existing Express app
/*
app.get("/api/v1/check-technician", verifyUser, async (req, res) => {
    try {
        // Extract user ID from the decoded JWT token
        const userId = req.user.id;

        // Query the database to check if the user is a technician
        const result = await db.query("SELECT * FROM users WHERE id = $1 AND role = 'technician'", [userId]);

        // If the user is a technician, return success status
        if (result.rows.length > 0) {
            return res.status(200).json({ status: "Success", message: "User is a technician" });
        } else {
            return res.status(401).json({ status: "Error", message: "User is not a technician" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

*/

app.get("/api/v1/notifequip/:id", async (req, res) => {
    try {
        const equipement = await db.query(
            "SELECT equipement.* " +
            "FROM equipement " +
            "LEFT JOIN reclamation ON equipement.id = reclamation.equipement_id " +
            "WHERE equipement.deleted = false AND reclamation.deleted = false AND reclamation.equipement_id IS NOT NULL AND equipement.id = $1",
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
app.get("/api/v1/notifcomp/:id", async (req, res) => {
    try {
        const composant = await db.query(
            `SELECT composant.* 
             FROM composant 
             LEFT JOIN reclamation ON composant.id = reclamation.composant_id 
             WHERE composant.deleted = false 
             AND reclamation.deleted = false 
             AND reclamation.composant_id IS NOT NULL 
             AND composant.id = $1`,
            [req.params.id]
        );

        if (composant.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Component not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                composant: composant.rows[0],
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
app.get("/api/v1/unit", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM unit");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                unit: results.rows,
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

app.get("/api/v1/unitperiode", async (req, res) => {
    try {

        const results = await db.query("SELECT * FROM unit WHERE unit IN ('jours', 'minute', 'seconde', 'heure')");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                unit: results.rows,
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

app.get("/api/v1/unitproduit", async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM unit WHERE unit NOT IN ('jours', 'minute', 'seconde', 'heure')");
        res.status(200).json({
            status: "success",
            results: results.rows,
            data: {
                unit: results.rows,
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

app.post("/api/v1/unit",  async (req, res) =>{
    try {
   
        const results = await db.query(
            "INSERT INTO unit (unit) VALUES ($1) RETURNING *",
            [
                req.body.unit
            
            ]
        );

        res.status(201).json({
            status: "success",
            data: {
                unit: results.rows[0],
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

cron.schedule('*/2 * * * *', () => {
    // This function will run every 6 hours
    sendReminderMessage();
});

// Function to send the reminder message
function sendReminderMessage() {
    // Implement your logic to send the reminder message here
    console.log("Reminder message sent: Vous devez mettre à jour la valeur actuelle de l'équipement");
}

// Define the API endpoint
app.get("/api/v1/cron_reminder", async (req, res) => {
    // Send the reminder message when the endpoint is called
    sendReminderMessage();
    
    // Respond with success message
    res.status(200).json({
        status: "success",
        message: "Vous devez mettre à jour la valeur actuelle de l'équipement",
    });
});


//////////////////////////////////*/
/////////// ************ predictive *********/////////////
app.get("/api/v1/predictive", async (req, res) => {
    try {
        const results = await db.query(`
            SELECT predictive.*, equipement.name AS equipement_name,
            composant.name_comp AS composant_name,
            employee.firstname AS responsible_name,
            technicien.name  AS technicien_name 
            FROM predictive 
            LEFT JOIN equipement ON predictive.equipement_id = equipement.id
            LEFT JOIN composant ON predictive.composant_id = composant.id
            LEFT JOIN employee ON predictive.responsible = employee.id
            LEFT JOIN technicien ON predictive.technicien_id = technicien.id
            WHERE predictive.deleted = false
        `);
        const equipments = await db.query("SELECT id, name FROM equipement WHERE deleted = false");
        const composants = await db.query("SELECT id, name_comp FROM composant WHERE deleted = false");
        const employees = await db.query("SELECT id, firstname FROM employee WHERE deleted = false");
        const techniciens = await db.query("SELECT id, name FROM technicien WHERE deleted = false");

        res.status(200).json({
            status: "success",
            results: results.rows.length,
            data: {
                predictives: results.rows,
                equipments: equipments.rows,
                composants: composants.rows,
                employees: employees.rows,
                techniciens: techniciens.rows
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

app.get("/api/v1/predictive/:id", async (req, res) => {
    try {
        const predictive = await db.query(
            "SELECT * FROM predictive WHERE id = $1",
            [req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                predictive: predictive.rows[0],
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

app.post("/api/v1/predictive", async (req, res) => {
    try {
        let {
            ref,
            equipement_id,
            priority,
            state,
            created_by,
            responsible,
            creation_date,
            final_date,
            planified_date,
            duration,
            description,
            technicien_id,
            datepanne,
            composant_id,
        } = req.body;

        // Convert incoming date strings to Date objects
        creation_date = new Date(creation_date);
        final_date = final_date ? new Date(final_date) : null;
        planified_date = planified_date ? new Date(planified_date) : null;
        datepanne = datepanne ? new Date(datepanne) : null;

        if (!final_date) {
            final_date = null;
        }
        if (!planified_date) {
            planified_date = null;
        }
        if (!duration) {
            duration = null;
        }

        const results = await db.query(
            "INSERT INTO predictive (ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 , $13, $14) RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id]
        );
        res.status(201).json({
            status: "success",
            data: {
                predictive: results.rows[0],
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


app.put("/api/v1/predictive/:id", async (req, res) => {
    try {
        const { ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id} = req.body;
        const results = await db.query(
            "UPDATE predictive SET ref = $1, equipement_id = $2, priority = $3, state = $4, created_by = $5, responsible = $6, creation_date = $7, final_date = $8, planified_date = $9, duration = $10, description = $11, technicien_id = $12, datepanne = $13, composant_id = $14 WHERE id = $15 RETURNING *",
            [ref, equipement_id, priority, state, created_by, responsible, creation_date, final_date, planified_date, duration, description, technicien_id, datepanne, composant_id, req.params.id]
        );
        res.status(200).json({
            status: "success",
            data: {
                predictive: results.rows[0],
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



app.put("/api/v1/predictive/predictiveRef/:ref", async (req, res) => {
    try {
        const { affecter , technicien_id } = req.body;

        const results = await db.query(
            `UPDATE predictive 
             SET  affecter = $1, technicien_id = $2 
             WHERE ref = $3
             RETURNING *`,
            [  affecter, technicien_id, req.params.ref]
        );

        if (results.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "predictive not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                predictive: results.rows[0],
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


app.get("/api/v1/predictive/predictiveRef/:ref", async (req, res) => {
    try {       
        const results = await db.query(
            `SELECT predictive.*, equipement.name AS equipement_name,
            composant. name_comp AS composant_name,
            equipement.image AS equipement_image
            FROM predictive 
            LEFT JOIN composant ON predictive.composant_id = composant.id
            LEFT JOIN equipement ON predictive.equipement_id = equipement.id
            WHERE predictive.deleted = false AND predictive.ref = $1`,
            [req.params.ref]
        );

        const equipments = await db.query("SELECT id, name, image FROM equipement WHERE deleted = false");
        const composants = await db.query("SELECT id, name_equip, name_comp, reference FROM composant WHERE deleted = false");

        res.status(200).json({
            status: "success",
            data: {
                predictive: results.rows[0],
                equipments: equipments.rows,
                composants : composants.rows
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



app.delete("/api/v1/predictive/:id", async (req, res) => {
    try {
        await db.query("UPDATE predictive SET deleted = true WHERE id = $1", [req.params.id]);
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

app.get("/api/v1/preventive2", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT MAX(id) AS lastid FROM preventive");
        const lastId = rows.length > 0 ? parseInt(rows[0].lastid) : 0; // Convertir lastid en entier, ou 0 si la table est vide
        res.status(200).json({
            status: "success",
            data: {
                lastId
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});


////////////////////////////////////* calendar /

app.get('/api/v1/events', (req, res) => {
    res.json(events);
  });
  
  // Create a new event
  app.post('/api/v1/events', (req, res) => {
    const newEvent = req.body;
    newEvent.id = Date.now(); // Generate unique ID
    events.push(newEvent);
    res.status(201).json(newEvent);
  });
  
  // Delete an event by ID
  app.delete('/api/v1/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id);
    events = events.filter(event => event.id !== eventId);
    res.sendStatus(204);
  });
  
  // Update an event by ID
  app.put('/api/v1/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id);
    const updatedEvent = req.body;
    events = events.map(event => event.id === eventId ? { ...event, ...updatedEvent } : event);
    res.json(updatedEvent);
  });



app.use((err, _req, res, next) => {
    if (res.headersSent) return next(err);

    if (err.code === "CLOUDINARY_CONFIG_MISSING") {
        return res.status(503).json({
            status: "error",
            code: err.code,
            message: "Le stockage Cloudinary n'est pas configuré sur le serveur.",
        });
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            status: "error",
            message: "Le fichier envoyé est invalide ou dépasse la limite autorisée.",
        });
    }

    if (err.isCloudinaryUploadError) {
        console.error("Cloudinary upload failed:", err.message);
        return res.status(502).json({
            status: "error",
            message: "Cloudinary n'a pas pu enregistrer le fichier. Vérifiez ses paramètres et réessayez.",
        });
    }

    console.error("Unhandled request error:", err.message);
    return res.status(500).json({ status: "error", message: "Internal server error" });
});

const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
    console.log(`server is up listening ${port}`);
});
