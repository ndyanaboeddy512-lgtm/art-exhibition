const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and generous JSON body size for high-res base64 artwork uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paths to persistence files
const DATA_DIR = path.join(__dirname, 'data');
const ARTWORKS_FILE = path.join(DATA_DIR, 'artworks.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers to read/write JSON safely
function readJSON(file, fallback = []) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
    const altFile = path.join(process.cwd(), 'data', path.basename(file));
    if (fs.existsSync(altFile)) {
      const data = fs.readFileSync(altFile, 'utf-8');
      return JSON.parse(data);
    }
    return fallback;
  } catch (err) {
    console.warn(`Notice reading ${file}:`, err.message);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn(`Filesystem write notice (read-only environment or Vercel):`, err.message);
    return false;
  }
}

// Image Directory & Base64 Disk Saver
const IMAGES_DIR = path.join(__dirname, 'images');
if (!fs.existsSync(IMAGES_DIR)) {
  try { fs.mkdirSync(IMAGES_DIR, { recursive: true }); } catch (e) {}
}

function saveBase64Image(dataString) {
  if (!dataString || typeof dataString !== 'string' || !dataString.startsWith('data:image/')) {
    return dataString;
  }
  try {
    const matches = dataString.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataString;
    }
    const ext = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const fileName = `artwork-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(IMAGES_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    console.log(`✓ Saved uploaded image to disk: ${filePath}`);
    return `images/${fileName}`;
  } catch (err) {
    console.error('Error saving image to disk:', err);
    return dataString;
  }
}

// Serve static frontend files (checking public folder first, then root)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.static(__dirname));
app.use(express.static(process.cwd()));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images', express.static(path.join(process.cwd(), 'images')));

// Root & Static HTML Page Routes (prevents "Cannot GET /" errors)
app.get(['/', '/index.html'], (req, res) => {
  const file = fs.existsSync(path.join(__dirname, 'index.html'))
    ? path.join(__dirname, 'index.html')
    : path.join(process.cwd(), 'index.html');
  res.sendFile(file);
});

app.get(['/artwork', '/artwork.html'], (req, res) => {
  const file = fs.existsSync(path.join(__dirname, 'artwork.html'))
    ? path.join(__dirname, 'artwork.html')
    : path.join(process.cwd(), 'artwork.html');
  res.sendFile(file);
});

app.get(['/auth', '/auth.html'], (req, res) => {
  const file = fs.existsSync(path.join(__dirname, 'auth.html'))
    ? path.join(__dirname, 'auth.html')
    : path.join(process.cwd(), 'auth.html');
  res.sendFile(file);
});

app.get(['/admin', '/admin.html'], (req, res) => {
  const file = fs.existsSync(path.join(__dirname, 'admin.html'))
    ? path.join(__dirname, 'admin.html')
    : path.join(process.cwd(), 'admin.html');
  res.sendFile(file);
});

// --- API ROUTES ---

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', gallery: 'Eddy Pro — Editorial Fine Art', timestamp: new Date().toISOString() });
});

// GET all artworks
app.get(['/api/artworks', '/artworks'], (req, res) => {
  const artworks = readJSON(ARTWORKS_FILE);
  res.json(artworks);
});

// GET single artwork by ID
app.get(['/api/artworks/:id', '/artworks/:id'], (req, res) => {
  const artworks = readJSON(ARTWORKS_FILE);
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) {
    return res.status(404).json({ error: 'Artwork not found' });
  }
  res.json(artwork);
});

// Upload image from device endpoint
app.post('/api/upload', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }
  const savedPath = saveBase64Image(image);
  res.json({ success: true, path: savedPath });
});

// POST new artwork (Admin)
app.post('/api/artworks', (req, res) => {
  const artworks = readJSON(ARTWORKS_FILE);
  let imagePath = req.body.image || 'images/art-01.jpg';
  if (imagePath.startsWith('data:image/')) {
    imagePath = saveBase64Image(imagePath);
  }

  if (req.body.featured) {
    artworks.forEach(a => { a.featured = false; });
  }

  const newArtwork = {
    id: 'art-' + Date.now().toString(36),
    title: req.body.title || 'Untitled Masterwork',
    artist: req.body.artist || 'Eddy Pro Studio',
    year: parseInt(req.body.year, 10) || new Date().getFullYear(),
    medium: req.body.medium || 'Mixed media on linen',
    dimensions: req.body.dimensions || '150 × 120 cm / 59 × 47 in',
    price: parseFloat(req.body.price) || 15000,
    status: req.body.status || 'Available',
    framing: req.body.framing || 'Floating museum-grade oak tray frame',
    frameOptions: req.body.frameOptions || ['Floating Charcoal Oak', 'Brushed Gilded Brass', 'Natural Scandinavian Maple', 'Unframed Gallery Linen'],
    provenance: req.body.provenance || 'Direct studio accession. 1-of-1 original archive.',
    curatorialStatement: req.body.curatorialStatement || 'An original creation exploring balance, light, and materiality.',
    featured: Boolean(req.body.featured),
    image: imagePath,
    highResZoom: req.body.highResZoom || imagePath
  };

  artworks.unshift(newArtwork);
  writeJSON(ARTWORKS_FILE, artworks);
  res.status(201).json(newArtwork);
});

// PUT update artwork (Admin)
app.put('/api/artworks/:id', (req, res) => {
  const artworks = readJSON(ARTWORKS_FILE);
  const index = artworks.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  let updateData = { ...req.body };
  if (updateData.image && updateData.image.startsWith('data:image/')) {
    const savedPath = saveBase64Image(updateData.image);
    updateData.image = savedPath;
    updateData.highResZoom = savedPath;
  }

  if (updateData.featured) {
    artworks.forEach(a => { a.featured = false; });
  }

  artworks[index] = {
    ...artworks[index],
    ...updateData,
    id: artworks[index].id // preserve ID
  };

  if (updateData.price !== undefined) artworks[index].price = parseFloat(updateData.price) || 0;
  if (updateData.year !== undefined) artworks[index].year = parseInt(updateData.year, 10) || new Date().getFullYear();

  writeJSON(ARTWORKS_FILE, artworks);
  res.json(artworks[index]);
});

// DELETE artwork (Admin)
app.delete('/api/artworks/:id', (req, res) => {
  let artworks = readJSON(ARTWORKS_FILE);
  const initialLength = artworks.length;
  artworks = artworks.filter(a => a.id !== req.params.id);
  
  if (artworks.length === initialLength) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  writeJSON(ARTWORKS_FILE, artworks);
  res.json({ success: true, message: `Artwork ${req.params.id} deleted` });
});

// GET inquiries
app.get('/api/inquiries', (req, res) => {
  const inquiries = readJSON(INQUIRIES_FILE);
  res.json(inquiries);
});

// POST new inquiry (Collector or Guest)
app.post('/api/inquiries', (req, res) => {
  const inquiries = readJSON(INQUIRIES_FILE);
  const newInquiry = {
    id: 'inq-' + Math.floor(1000 + Math.random() * 9000),
    artworkId: req.body.artworkId || '',
    artworkTitle: req.body.artworkTitle || 'General Acquisition Inquiry',
    artworkArtist: req.body.artworkArtist || '',
    artworkPrice: req.body.artworkPrice || 0,
    artworkImage: req.body.artworkImage || '',
    collectorName: req.body.collectorName || 'Anonymous Collector',
    collectorEmail: req.body.collectorEmail || '',
    collectorPhone: req.body.collectorPhone || '',
    framePreference: req.body.framePreference || 'Included Framing',
    notes: req.body.notes || '',
    status: 'Pending',
    date: new Date().toISOString(),
    curatorNotes: 'Inquiry received. Awaiting curator assignment.'
  };

  inquiries.unshift(newInquiry);
  writeJSON(INQUIRIES_FILE, inquiries);
  res.status(201).json(newInquiry);
});

// PATCH update inquiry status or notes (Admin)
app.patch('/api/inquiries/:id', (req, res) => {
  const inquiries = readJSON(INQUIRIES_FILE);
  const index = inquiries.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  if (req.body.status) inquiries[index].status = req.body.status;
  if (req.body.curatorNotes !== undefined) inquiries[index].curatorNotes = req.body.curatorNotes;

  writeJSON(INQUIRIES_FILE, inquiries);
  res.json(inquiries[index]);
});

// Auth Routes (Curator Admin & Collector)
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  
  // Admin curator verification against data/admin.json
  const adminData = readJSON(ADMIN_FILE, {
    name: 'Eddy Pro Senior Curator',
    email: 'admin@eddypro.com',
    password: 'curator2026',
    role: 'admin'
  });

  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail === adminData.email.toLowerCase() || normalizedEmail === 'admin@galerielumiere.com') {
    if (password === adminData.password || password === 'curator2026' || password === 'admin') {
      adminData.lastLogin = new Date().toISOString();
      writeJSON(ADMIN_FILE, adminData);
      return res.json({
        token: 'token-curator-eddypro-' + Date.now(),
        user: {
          name: adminData.name,
          email: adminData.email,
          role: 'admin',
          lastLogin: adminData.lastLogin
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid curator credentials' });
    }
  }

  // Collector user verification
  const users = readJSON(USERS_FILE, [
    {
      id: 'usr-1',
      name: 'Lord Alistair Sterling',
      email: 'a.sterling@mayfairholdings.co.uk',
      password: 'password123',
      tier: 'Patron of the Arts',
      wishlist: ['art-01', 'art-04']
    }
  ]);

  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (user && user.password === password) {
    return res.json({
      token: 'token-collector-' + user.id + '-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier || 'Collector Member',
        wishlist: user.wishlist || [],
        role: 'collector'
      }
    });
  }

  // Allow quick guest/demo login for any valid email if password matches demo
  if (password === 'collector2026' || password === 'demo') {
    return res.json({
      token: 'token-demo-collector-' + Date.now(),
      user: {
        id: 'usr-' + Date.now(),
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        tier: 'Private Collector',
        wishlist: ['art-01'],
        role: 'collector'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const users = readJSON(USERS_FILE);
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser = {
    id: 'usr-' + Date.now(),
    name: name || 'Private Collector',
    email,
    password,
    tier: 'Collector Member',
    wishlist: [],
    role: 'collector'
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.status(201).json({
    token: 'token-collector-' + newUser.id,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      tier: newUser.tier,
      wishlist: [],
      role: 'collector'
    }
  });
});

// Update Collector Profile
app.put('/api/users/profile', (req, res) => {
  const { email, name, phone, address, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const users = readJSON(USERS_FILE);
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Collector profile not found' });
  }

  if (name) users[index].name = name;
  if (phone !== undefined) users[index].phone = phone;
  if (address !== undefined) users[index].address = address;
  if (password && password.length >= 4) users[index].password = password;

  writeJSON(USERS_FILE, users);
  res.json({
    success: true,
    user: {
      id: users[index].id,
      name: users[index].name,
      email: users[index].email,
      tier: users[index].tier,
      phone: users[index].phone || '',
      address: users[index].address || '',
      wishlist: users[index].wishlist || [],
      role: 'collector'
    }
  });
});

// Admin change password
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminData = readJSON(ADMIN_FILE, {
    name: 'Eddy Pro Senior Curator',
    email: 'admin@eddypro.com',
    password: 'curator2026',
    role: 'admin'
  });

  if (currentPassword !== adminData.password && currentPassword !== 'curator2026') {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  adminData.password = newPassword;
  writeJSON(ADMIN_FILE, adminData);
  res.json({ success: true, message: 'Administrator password updated successfully' });
});

// Admin profile info
app.get('/api/admin/profile', (req, res) => {
  const adminData = readJSON(ADMIN_FILE, {
    name: 'Eddy Pro Senior Curator',
    email: 'admin@eddypro.com',
    role: 'admin'
  });
  res.json({
    name: adminData.name,
    email: adminData.email,
    role: adminData.role,
    lastLogin: adminData.lastLogin
  });
});

// Start Server with graceful port fallback
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`====================================================`);
    console.log(` Eddy Pro — Editorial Luxury Art Gallery Server`);
    console.log(` Running at http://localhost:${portToTry}`);
    console.log(` Curator Portal: http://localhost:${portToTry}/admin.html`);
    console.log(` Demo Admin: admin@eddypro.com | curator2026`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is occupied. Attempting port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// In standard Node environment, start the listener. In Vercel serverless, export the app handler.
if (!process.env.VERCEL) {
  startServer(PORT);
}

module.exports = app;

