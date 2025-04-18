// server.js
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const sharp       = require('sharp');
const ffmpeg      = require('fluent-ffmpeg');
const sqlite3 = require('sqlite3').verbose();

let selectedFolderPath = null;
const app = express();
app.use(cors());
app.use(express.json());

// --- 1) Configure your SQLite database connection ---
const db = new sqlite3.Database('photoDB.sql',sqlite3.OPEN_READWRITE, (err)=> {
    if (err) return console.error(err.message);
    console.log('Connected to the SQlite database.');
});

// Shared path to your media folder (determined by folderManager.js)
function ensureFolder(req, res, next) {
    if (!selectedFolderPath) {
      return res.status(400).json({ error: 'No folder selected yet' });
    }
    next();
  }
  
  // apply it to any route that needs the folder:
  app.get('/photos/:filePath', ensureFolder, (req, res) => {
    const filePath = path.join(selectedFolderPath, req.params.filePath);
    res.download(filePath, err => {
      if (err) res.status(404).send('Not found');
    });
  });

// --- 2) Routes ---

// Welcome
app.get('/', (req, res) => {
  res.send('Welcome to the Pinecone Photo Management System!');
});

app.post('/set-folder', (req, res) => {
    const folderPath = req.body.path;
    if (!folderPath) return res.status(400).json({ error: 'Missing path' });
    selectedFolderPath = folderPath;
    console.log('Selected folder:', selectedFolderPath);
    res.json({ message: 'Folder set successfully' });
    }),

// Fetch paged photos (calls stored proc)
app.get('/photos', async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 100;
  const search= req.query.search  || '';
  const tags  = req.query.tags    || '';
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('Page',   sql.Int,    page)
      .input('Limit',  sql.Int,    limit)
      .input('Search', sql.VarChar(255), `%${search}%`)
      .input('Tags',   sql.VarChar(sql.MAX), tags)
      .execute('dbo.FetchPhotos');

    // Translate to JSON + encode filenames + set file_type
    const data = result.recordset.map(r => {
      const fn = encodeURIComponent(r.file_name);
      return {
        ...r,
        file_name: fn,
        file_type: fn.toLowerCase().endsWith('.mp4') ? 'video' : 'image'
      };
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Simple search by title/description
app.get('/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('Q1', sql.VarChar(255), `%${q}%`)
      .input('Q2', sql.VarChar(255), `%${q}%`)
      .query(`SELECT * FROM photos
              WHERE title LIKE @Q1
                 OR description LIKE @Q2`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve a raw photo (download attachment)
app.get('/photos/:filePath', (req, res) => {
  const filePath = path.join(IMG_FOLDER, req.params.filePath);
  res.download(filePath, err => {
    if (err) res.status(404).send('Not found');
  });
});

// Generate a 200×200 thumbnail
app.get('/thumbnail/:filePath', (req, res) => {
  const fullPath = path.join(IMG_FOLDER, req.params.filePath);

  if (fullPath.toLowerCase().endsWith('.mp4')) {
    // grab first frame from video
    ffmpeg(fullPath)
      .screenshots({
        timestamps: ['0'],
        size: '200x200',
        folder:   '/tmp',
        filename: 'thumb.jpg'
      })
      .on('end', () => {
        res.sendFile(path.join('/tmp', 'thumb.jpg'));
      })
      .on('error', err => {
        console.error(err);
        res.status(500).json({ error: err.message });
      });
  } else {
    // image -> resize with sharp
    sharp(fullPath)
      .resize(200, 200)
      .toBuffer()
      .then(buffer => {
        res.type('jpeg').send(buffer);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.message });
      });
  }
});

// List all tags
app.get('/tags', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .query('SELECT DISTINCT tag_name FROM tags');
    // pull out just the names
    res.json(result.recordset.map(r => r.tag_name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add a tag to a photo
app.post('/photos/:id/tags', async (req, res) => {
  const photoId = parseInt(req.params.id);
  const tagName = req.body.tag_name;
  if (!tagName) return res.status(400).json({ error: 'Missing tag_name' });

  try {
    const pool = await getDbPool();
    // find tag id
    const tagRes = await pool.request()
      .input('Name', sql.VarChar(255), tagName)
      .query('SELECT id FROM tags WHERE tag_name = @Name');
    if (!tagRes.recordset.length) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    const tagId = tagRes.recordset[0].id;

    // insert link
    await pool.request()
      .input('Photo', sql.Int, photoId)
      .input('Tag',   sql.Int, tagId)
      .query('INSERT INTO photo_tags (photo_id, tag_id) VALUES (@Photo,@Tag)');

    res.json({ message: 'Tag added to photo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get tags for a photo
app.get('/photos/:id/tags', async (req, res) => {
  const photoId = parseInt(req.params.id);
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('Photo', sql.Int, photoId)
      .query(`SELECT t.* FROM tags t
              JOIN photo_tags pt ON t.id = pt.tag_id
              WHERE pt.photo_id = @Photo`);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Remove a tag from a photo
app.delete('/photos/:id/tags/:tag', async (req, res) => {
  const photoId = parseInt(req.params.id);
  const tagName = req.params.tag;
  try {
    const pool = await getDbPool();
    const tagRes = await pool.request()
      .input('Name', sql.VarChar(255), tagName)
      .query('SELECT id FROM tags WHERE tag_name = @Name');
    if (!tagRes.recordset.length) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    const tagId = tagRes.recordset[0].id;

    await pool.request()
      .input('Photo', sql.Int, photoId)
      .input('Tag',   sql.Int, tagId)
      .query('DELETE FROM photo_tags WHERE photo_id=@Photo AND tag_id=@Tag');

    res.json({ message: 'Tag removed from photo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- 4) Start the server ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Node backend running at http://localhost:${PORT}`);
});
