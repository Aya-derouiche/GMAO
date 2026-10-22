require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const cloudinary = require("cloudinary").v2;

const databaseUrl = process.env.DATABASE_URL?.trim();
const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL?.trim());
const cloudinaryCredentials = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};
const hasIndividualCredentials = Object.values(cloudinaryCredentials).every(Boolean);
const applyChanges = process.argv.includes("--apply");
const uploadFolder = `${process.env.CLOUDINARY_FOLDER || "gmao"}/legacy`;
const uploadsDir = [path.join(__dirname, "..", "Uploads"), path.join(__dirname, "..", "uploads")]
  .find((directory) => fs.existsSync(directory));

const referenceColumns = [
  ["equipement", "image"],
  ["equipement", "fichier"],
  ["employee", "documents"],
  ["composant", "fichier"],
  ["nomlogo", "image"],
];

function fileKey(value) {
  if (!value || /^https?:\/\//i.test(String(value))) return null;
  return String(value).replace(/\\/g, "/").split("/").filter(Boolean).pop()?.toLowerCase() || null;
}

async function main() {
  if (!databaseUrl) throw new Error("DATABASE_URL is required to migrate existing file references");
  if (!hasCloudinaryUrl && !hasIndividualCredentials) {
    throw new Error("Set CLOUDINARY_URL or all three CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET values");
  }
  if (!uploadsDir) throw new Error("Could not find server/Uploads or server/uploads");
  if (hasIndividualCredentials) cloudinary.config({ ...cloudinaryCredentials, secure: true });

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const localFiles = new Map(
      fs.readdirSync(uploadsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => [entry.name.toLowerCase(), path.join(uploadsDir, entry.name)])
    );
    const references = [];

    for (const [table, column] of referenceColumns) {
      const result = await client.query(`SELECT id, "${column}" AS value FROM "${table}" WHERE "${column}" IS NOT NULL`);
      for (const row of result.rows) {
        const key = fileKey(row.value);
        if (key && localFiles.has(key)) references.push({ table, column, id: row.id, key });
      }
    }

    const filesToUpload = [...new Set(references.map((reference) => reference.key))];
    console.log(`Matched ${references.length} database references to ${filesToUpload.length} local files.`);

    if (!applyChanges) {
      console.log("Preview only: no files uploaded and no database rows changed. Rerun with --apply to migrate.");
      return;
    }

    const urlsByFile = new Map();
    for (const key of filesToUpload) {
      const filePath = localFiles.get(key);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: uploadFolder,
        public_id: path.basename(filePath),
        resource_type: "auto",
        use_filename: false,
        unique_filename: false,
        overwrite: true,
      });
      urlsByFile.set(key, result.secure_url);
      console.log(`Uploaded one referenced file to Cloudinary.`);
    }

    await client.query("BEGIN");
    try {
      for (const reference of references) {
        await client.query(
          `UPDATE "${reference.table}" SET "${reference.column}" = $1 WHERE id = $2`,
          [urlsByFile.get(reference.key), reference.id]
        );
      }
      await client.query("COMMIT");
      console.log(`Updated ${references.length} database file references.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
