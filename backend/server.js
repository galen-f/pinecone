// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const sqlite3 = require('sqlite3').verbose();


const app = express();
app.use(cors());
app.use(express.json());

let selectedFolderPath = null;

// Open SQLite database (schema defined in photoDB.sql)
const db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE, err => {
  if (err) console.error('DB open error:', err.message);
  else console.log('Connected to in-memory SQLite database.');
  initSchema(); // Initialize schema on startup
});

// Create tables if they don't exist
function initSchema() {
    const schemaPath = path.join(__dirname, 'photoDB.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema, err => {
        if (err && !/already exists/.test(err.message)) {
            console.error('Schema initialization error:', err.message);
        } 
        else console.log('Database schema is in place.');
    });
}

// Promisify for async/await
const dbAll = util.promisify(db.all.bind(db));
const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));

// Middleware: ensure a folder has been set
function ensureFolder(req, res, next) {
  if (!selectedFolderPath) {
    return res.status(400).json({ error: 'No folder selected yet' });
  }
  next();
}

// POST /set-folder — receive path, scan files, populate DB
app.post('/set-folder', async (req, res) => {
  const folderPath = req.body.path;
  if (!folderPath) return res.status(400).json({ error: 'Missing path' });
  selectedFolderPath = folderPath;
  try {
    await scanFolderAndPopulateDB(folderPath);
    console.log('Folder scanned and DB populated.');
    res.json({ message: 'Folder set and scanned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Recursively scan folder for media and insert into Photos table
async function scanFolderAndPopulateDB(folder) {
  // Clear existing data
  await dbRun('DELETE FROM Photos');

  const files = await getMediaFiles(folder);
  for (const filePath of files) {
    const relative = path.relative(folder, filePath).replace(/\\/g, '/');
    await dbRun(
      'INSERT INTO Photos(file_name, location) VALUES (?, ?)',
      path.basename(filePath),
      relative
    );
  }
}

// Helper: get all image/video files under a directory
async function getMediaFiles(dir) {
  let results = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const sub = await getMediaFiles(full);
      results = results.concat(sub);
    } else if (/\.(jpe?g|png|gif|mp4|mov)$/i.test(ent.name)) {
      results.push(full);
    }
  }
  return results;
}

// GET /photos — list photos with pagination and search
app.get('/photos', ensureFolder, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let sql = 'SELECT * FROM Photos';
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('file_name LIKE ?');
    params.push(`%${search}%`);
  }

  if (clauses.length) {
    sql += ' WHERE ' + clauses.join(' AND ');
  }
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const rows = await dbAll(sql, params);
    const data = rows.map(r => ({
      ...r,
      file_type: /\.(mp4|mov)$/i.test(r.file_name) ? 'video' : 'image'
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /media/:location — serve original file
app.get('/media/:location', ensureFolder, (req, res) => {
  const filePath = path.join(selectedFolderPath, req.params.location);
  res.sendFile(filePath, err => {
    if (err) res.status(404).send('Not found');
  });
});

// GET /thumbnail/:location: on-demand thumbnail with caching
app.get('/thumbnail/:location', ensureFolder, async (req, res) => {
    const rel = req.params.location;
    const fullPath = path.join(selectedFolderPath, rel);
    const cacheDir = path.join(os.tmpdir(), 'pinecone-thumbs', path.dirname(rel));
    const thumbName = path.basename(rel) + '.jpg';
    const thumbPath = path.join(cacheDir, thumbName);
  
    try {
      await fs.promises.mkdir(cacheDir, { recursive: true });
      if (fs.existsSync(thumbPath)) {
        return res.sendFile(thumbPath);
      }
      if (/\.(mp4|mov)$/i.test(fullPath)) {
        ffmpeg(fullPath)
          .screenshots({ timestamps: ['0'], size: '200x200', folder: cacheDir, filename: thumbName })
          .on('end', () => res.sendFile(thumbPath))
          .on('error', err => res.status(500).json({ error: err.message }));
      } else {
        sharp(fullPath)
          .resize(200, 200)
          .toFile(thumbPath)
          .then(() => res.sendFile(thumbPath))
          .catch(err => res.status(500).json({ error: err.message }));
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
