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
  if (!value) return null;
  let normalizedValue = String(value).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedValue)) {
    try {
      const parsedUrl = new URL(normalizedValue);
      if (parsedUrl.hostname.endsWith("res.cloudinary.com") || !parsedUrl.pathname.includes("/uploads/")) {
        return null;
      }
      normalizedValue = parsedUrl.pathname;
    } catch {
      return null;
    }
  }
  const encodedName = normalizedValue.split(/[?#]/, 1)[0].split("/").filter(Boolean).pop();
  if (!encodedName) return null;
  try {
    return decodeURIComponent(encodedName).toLowerCase();
  } catch {
    return encodedName.toLowerCase();
  }
}

async function main() {
  if (!databaseUrl) throw new Error("DATABASE_URL is required to migrate existing file references");
  if (applyChanges && !hasCloudinaryUrl && !hasIndividualCredentials) {
    throw new Error("Set CLOUDINARY_URL or all three CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET values");
  }
  if (!uploadsDir) throw new Error("Could not find server/Uploads or server/uploads");
  if (!hasCloudinaryUrl && hasIndividualCredentials) {
    cloudinary.config({ ...cloudinaryCredentials, secure: true });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const localFiles = new Map(
      fs.readdirSync(uploadsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => [entry.name.toLowerCase(), path.join(uploadsDir, entry.name)])
    );
    const references = [];
    const unresolvedReferences = [];

    for (const [table, column] of referenceColumns) {
      const result = await client.query(`SELECT id, "${column}" AS value FROM "${table}" WHERE "${column}" IS NOT NULL`);
      for (const row of result.rows) {
        const key = fileKey(row.value);
        if (!key) continue;
        if (localFiles.has(key)) {
          references.push({ table, column, id: row.id, key });
        } else {
          unresolvedReferences.push({ table, column, id: row.id, value: row.value });
        }
      }
    }

    const filesToUpload = [...new Set(references.map((reference) => reference.key))];
    console.log(`Matched ${references.length} database references to ${filesToUpload.length} local files.`);
    console.log(`Unmatched legacy references: ${unresolvedReferences.length}.`);
    for (const reference of unresolvedReferences) {
      console.warn(`Missing local file for ${reference.table}.${reference.column}, row ${reference.id}: ${reference.value}`);
    }

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
      console.log(`Uploaded ${path.basename(filePath)} to Cloudinary.`);
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
      if (unresolvedReferences.length) {
        console.warn("Some old file references were not changed because their source files are absent locally. Recover and upload those files before updating their database values.");
      }
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
