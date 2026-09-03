const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let isAvailable = false;

// Determine connection config from environment or local defaults
function getPoolConfig() {
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connectionUrl) {
    return {
      uri: connectionUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: connectionUrl.includes('ssl') || process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '',
    database: process.env.MYSQL_DATABASE || 'art_gallery_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

// Initialize Database connection & create tables if they do not exist
async function initDatabase() {
  try {
    const config = getPoolConfig();

    // In local dev without database specified or to ensure DB exists:
    if (!config.uri && config.host === '127.0.0.1') {
      try {
        const rootConn = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password
        });
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.end();
      } catch (e) {
        console.warn('Notice verifying MySQL database existence:', e.message);
      }
    }

    pool = config.uri ? mysql.createPool(config.uri) : mysql.createPool(config);

    // Verify connectivity
    const connection = await pool.getConnection();
    console.log(`✓ Connected to MySQL database [${config.uri ? 'Cloud URL' : config.database + '@' + config.host}]`);
    connection.release();
    isAvailable = true;

    // Run schema creation
    await createTables();

    // Auto-seed from JSON files if database is fresh
    await seedIfEmpty();

    return true;
  } catch (err) {
    console.warn(`! MySQL unavailable (${err.message}). Using local JSON persistence engine.`);
    isAvailable = false;
    return false;
  }
}

async function createTables() {
  if (!isAvailable || !pool) return;

  const artworksTable = `
    CREATE TABLE IF NOT EXISTS artworks (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL DEFAULT '55 smartCREATIVES Studio',
      year INT DEFAULT 2026,
      medium VARCHAR(255) DEFAULT 'Fine Art',
      dimensions VARCHAR(128) DEFAULT 'Curated Scale',
      price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      status ENUM('Available', 'Reserved', 'Sold') NOT NULL DEFAULT 'Available',
      framing VARCHAR(255) DEFAULT 'Standard Gallery Presentation',
      frame_options JSON NULL,
      provenance TEXT NULL,
      curatorial_statement TEXT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      image VARCHAR(500) NOT NULL,
      high_res_zoom VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_featured (featured)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const inquiriesTable = `
    CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(64) PRIMARY KEY,
      artwork_id VARCHAR(64) NULL,
      artwork_title VARCHAR(255) NOT NULL DEFAULT 'General Acquisition Inquiry',
      artwork_artist VARCHAR(255) NULL,
      artwork_price DECIMAL(12, 2) DEFAULT 0.00,
      artwork_image VARCHAR(500) NULL,
      collector_name VARCHAR(255) NOT NULL,
      collector_email VARCHAR(255) NOT NULL,
      collector_phone VARCHAR(64) NULL,
      frame_preference VARCHAR(255) DEFAULT 'Included Framing',
      notes TEXT NULL,
      status ENUM('Pending', 'Contacted', 'Invoice Sent', 'Closed/Sold') NOT NULL DEFAULT 'Pending',
      opened BOOLEAN NOT NULL DEFAULT FALSE,
      is_customer_submission BOOLEAN NOT NULL DEFAULT TRUE,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      curator_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_inq_status (status),
      INDEX idx_inq_opened (opened),
      INDEX idx_inq_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      tier VARCHAR(64) DEFAULT 'Collector Member',
      phone VARCHAR(64) NULL,
      address TEXT NULL,
      wishlist JSON NULL,
      role VARCHAR(32) DEFAULT 'collector',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const adminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL DEFAULT '55 smartCREATIVES Admin',
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(32) DEFAULT 'admin',
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(artworksTable);
  await pool.query(inquiriesTable);
  await pool.query(usersTable);
  await pool.query(adminsTable);
  console.log('✓ MySQL tables verified / ready');
}

// Seed MySQL tables if empty from data/*.json files
async function seedIfEmpty() {
  if (!isAvailable || !pool) return;

  try {
    const dataDir = path.join(__dirname, 'data');

    // 1. Seed Artworks
    const [artworkCount] = await pool.query('SELECT COUNT(*) as count FROM artworks');
    if (artworkCount[0].count === 0 && fs.existsSync(path.join(dataDir, 'artworks.json'))) {
      const artworks = JSON.parse(fs.readFileSync(path.join(dataDir, 'artworks.json'), 'utf-8'));
      for (const a of artworks) {
        await pool.query(
          `INSERT INTO artworks (id, title, artist, year, medium, dimensions, price, status, framing, frame_options, provenance, curatorial_statement, featured, image, high_res_zoom)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title)`,
          [
            a.id, a.title, a.artist || '55 smartCREATIVES Studio',
            a.year || 2026, a.medium || 'Fine Art', a.dimensions || 'Custom Size',
            a.price || 0, a.status || 'Available', a.framing || 'Included Framing',
            JSON.stringify(a.frameOptions || []), a.provenance || '',
            a.curatorialStatement || '', a.featured ? 1 : 0,
            a.image, a.highResZoom || a.image
          ]
        );
      }
      console.log(`✓ Seeded ${artworks.length} artworks into MySQL`);
    }

    // 2. Seed Inquiries
    const [inquiryCount] = await pool.query('SELECT COUNT(*) as count FROM inquiries');
    if (inquiryCount[0].count === 0 && fs.existsSync(path.join(dataDir, 'inquiries.json'))) {
      const inquiries = JSON.parse(fs.readFileSync(path.join(dataDir, 'inquiries.json'), 'utf-8'));
      for (const inq of inquiries) {
        const inqDate = inq.date ? new Date(inq.date) : new Date();
        await pool.query(
          `INSERT INTO inquiries (id, artwork_id, artwork_title, artwork_artist, artwork_price, artwork_image, collector_name, collector_email, collector_phone, frame_preference, notes, status, opened, is_customer_submission, date, curator_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status)`,
          [
            inq.id, inq.artworkId || null, inq.artworkTitle || 'Acquisition Inquiry',
            inq.artworkArtist || '', inq.artworkPrice || 0, inq.artworkImage || '',
            inq.collectorName || 'Anonymous Collector', inq.collectorEmail || 'unknown@example.com',
            inq.collectorPhone || '', inq.framePreference || 'Included Framing',
            inq.notes || '', inq.status || 'Pending', inq.opened ? 1 : 0,
            inq.isCustomerSubmission !== false ? 1 : 0, inqDate, inq.curatorNotes || ''
          ]
        );
      }
      console.log(`✓ Seeded ${inquiries.length} inquiries into MySQL`);
    }

    // 3. Seed Users
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0 && fs.existsSync(path.join(dataDir, 'users.json'))) {
      const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
      for (const u of users) {
        await pool.query(
          `INSERT INTO users (id, name, email, password, tier, phone, address, wishlist, role)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            u.id, u.name, u.email, u.password, u.tier || 'Collector Member',
            u.phone || '', u.address || '', JSON.stringify(u.wishlist || []), u.role || 'collector'
          ]
        );
      }
      console.log(`✓ Seeded ${users.length} users into MySQL`);
    }

    // 4. Seed Admin
    const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (adminCount[0].count === 0 && fs.existsSync(path.join(dataDir, 'admin.json'))) {
      const adm = JSON.parse(fs.readFileSync(path.join(dataDir, 'admin.json'), 'utf-8'));
      await pool.query(
        `INSERT INTO admins (id, name, email, password, role)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        ['adm-1', adm.name || '55 smartCREATIVES Admin', adm.email || 'admin@eddypro.com', adm.password || 'curator2026', adm.role || 'admin']
      );
      console.log(`✓ Seeded admin curator account into MySQL`);
    }
  } catch (e) {
    console.warn('Notice during database initial seeding:', e.message);
  }
}

// --- ARTWORKS REPOSITORY ---

async function getArtworks() {
  if (!isAvailable || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM artworks ORDER BY created_at DESC');
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    year: r.year,
    medium: r.medium,
    dimensions: r.dimensions,
    price: parseFloat(r.price),
    status: r.status,
    framing: r.framing,
    frameOptions: typeof r.frame_options === 'string' ? JSON.parse(r.frame_options) : (r.frame_options || []),
    provenance: r.provenance,
    curatorialStatement: r.curatorial_statement,
    featured: Boolean(r.featured),
    image: r.image,
    highResZoom: r.high_res_zoom || r.image
  }));
}

async function getArtworkById(id) {
  if (!isAvailable || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM artworks WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    year: r.year,
    medium: r.medium,
    dimensions: r.dimensions,
    price: parseFloat(r.price),
    status: r.status,
    framing: r.framing,
    frameOptions: typeof r.frame_options === 'string' ? JSON.parse(r.frame_options) : (r.frame_options || []),
    provenance: r.provenance,
    curatorialStatement: r.curatorial_statement,
    featured: Boolean(r.featured),
    image: r.image,
    highResZoom: r.high_res_zoom || r.image
  };
}

async function createArtwork(artwork) {
  if (!isAvailable || !pool) return null;
  if (artwork.featured) {
    await pool.query('UPDATE artworks SET featured = FALSE');
  }
  await pool.query(
    `INSERT INTO artworks (id, title, artist, year, medium, dimensions, price, status, framing, frame_options, provenance, curatorial_statement, featured, image, high_res_zoom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      artwork.id, artwork.title, artwork.artist,
      artwork.year, artwork.medium, artwork.dimensions,
      artwork.price, artwork.status || 'Available', artwork.framing,
      JSON.stringify(artwork.frameOptions || []), artwork.provenance,
      artwork.curatorialStatement, artwork.featured ? 1 : 0,
      artwork.image, artwork.highResZoom || artwork.image
    ]
  );
  return getArtworkById(artwork.id);
}

async function updateArtwork(id, updates) {
  if (!isAvailable || !pool) return null;
  const existing = await getArtworkById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };

  if (updates.featured) {
    await pool.query('UPDATE artworks SET featured = FALSE');
  }

  await pool.query(
    `UPDATE artworks SET 
       title = ?, artist = ?, year = ?, medium = ?, dimensions = ?, price = ?,
       status = ?, framing = ?, frame_options = ?, provenance = ?, curatorial_statement = ?,
       featured = ?, image = ?, high_res_zoom = ?
     WHERE id = ?`,
    [
      merged.title, merged.artist, merged.year, merged.medium, merged.dimensions,
      merged.price, merged.status, merged.framing, JSON.stringify(merged.frameOptions || []),
      merged.provenance, merged.curatorialStatement, merged.featured ? 1 : 0,
      merged.image, merged.highResZoom || merged.image, id
    ]
  );
  return getArtworkById(id);
}

async function deleteArtwork(id) {
  if (!isAvailable || !pool) return false;
  const [res] = await pool.query('DELETE FROM artworks WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// --- INQUIRIES REPOSITORY ---

async function getInquiries() {
  if (!isAvailable || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY date DESC');
  return rows.map(r => ({
    id: r.id,
    artworkId: r.artwork_id,
    artworkTitle: r.artwork_title,
    artworkArtist: r.artwork_artist,
    artworkPrice: parseFloat(r.artwork_price) || 0,
    artworkImage: r.artwork_image,
    collectorName: r.collector_name,
    collectorEmail: r.collector_email,
    collectorPhone: r.collector_phone,
    framePreference: r.frame_preference,
    notes: r.notes,
    status: r.status,
    opened: Boolean(r.opened),
    isCustomerSubmission: Boolean(r.is_customer_submission),
    date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
    curatorNotes: r.curator_notes
  }));
}

async function createInquiry(inquiry) {
  if (!isAvailable || !pool) return null;
  const inqDate = inquiry.date ? new Date(inquiry.date) : new Date();

  await pool.query(
    `INSERT INTO inquiries (id, artwork_id, artwork_title, artwork_artist, artwork_price, artwork_image, collector_name, collector_email, collector_phone, frame_preference, notes, status, opened, is_customer_submission, date, curator_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       opened = VALUES(opened),
       curator_notes = VALUES(curator_notes)`,
    [
      inquiry.id, inquiry.artworkId || null, inquiry.artworkTitle || 'General Acquisition Inquiry',
      inquiry.artworkArtist || '', inquiry.artworkPrice || 0, inquiry.artworkImage || '',
      inquiry.collectorName || 'Anonymous Collector', inquiry.collectorEmail || 'unknown@example.com',
      inquiry.collectorPhone || '', inquiry.framePreference || 'Included Framing',
      inquiry.notes || '', inquiry.status || 'Pending', inquiry.opened ? 1 : 0,
      inquiry.isCustomerSubmission !== false ? 1 : 0, inqDate, inquiry.curatorNotes || ''
    ]
  );

  const [rows] = await pool.query('SELECT * FROM inquiries WHERE id = ?', [inquiry.id]);
  if (rows.length === 0) return inquiry;
  const r = rows[0];
  return {
    id: r.id,
    artworkId: r.artwork_id,
    artworkTitle: r.artwork_title,
    artworkArtist: r.artwork_artist,
    artworkPrice: parseFloat(r.artwork_price) || 0,
    artworkImage: r.artwork_image,
    collectorName: r.collector_name,
    collectorEmail: r.collector_email,
    collectorPhone: r.collector_phone,
    framePreference: r.frame_preference,
    notes: r.notes,
    status: r.status,
    opened: Boolean(r.opened),
    isCustomerSubmission: Boolean(r.is_customer_submission),
    date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
    curatorNotes: r.curator_notes
  };
}

async function updateInquiry(id, updates) {
  if (!isAvailable || !pool) return null;
  const [existing] = await pool.query('SELECT * FROM inquiries WHERE id = ?', [id]);
  if (existing.length === 0) return null;

  const current = existing[0];
  const newStatus = updates.status !== undefined ? updates.status : current.status;
  const newOpened = updates.opened !== undefined ? (updates.opened ? 1 : 0) : current.opened;
  const newCuratorNotes = updates.curatorNotes !== undefined ? updates.curatorNotes : current.curator_notes;

  await pool.query(
    'UPDATE inquiries SET status = ?, opened = ?, curator_notes = ? WHERE id = ?',
    [newStatus, newOpened, newCuratorNotes, id]
  );

  const [updated] = await pool.query('SELECT * FROM inquiries WHERE id = ?', [id]);
  const r = updated[0];
  return {
    id: r.id,
    artworkId: r.artwork_id,
    artworkTitle: r.artwork_title,
    artworkArtist: r.artwork_artist,
    artworkPrice: parseFloat(r.artwork_price) || 0,
    artworkImage: r.artwork_image,
    collectorName: r.collector_name,
    collectorEmail: r.collector_email,
    collectorPhone: r.collector_phone,
    framePreference: r.frame_preference,
    notes: r.notes,
    status: r.status,
    opened: Boolean(r.opened),
    isCustomerSubmission: Boolean(r.is_customer_submission),
    date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
    curatorNotes: r.curator_notes
  };
}

// --- USERS & AUTH REPOSITORY ---

async function getUserByEmail(email) {
  if (!isAvailable || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    tier: r.tier,
    phone: r.phone,
    address: r.address,
    wishlist: typeof r.wishlist === 'string' ? JSON.parse(r.wishlist) : (r.wishlist || []),
    role: r.role
  };
}

async function createUser(user) {
  if (!isAvailable || !pool) return null;
  await pool.query(
    `INSERT INTO users (id, name, email, password, tier, phone, address, wishlist, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id, user.name, user.email, user.password,
      user.tier || 'Collector Member', user.phone || '',
      user.address || '', JSON.stringify(user.wishlist || []),
      user.role || 'collector'
    ]
  );
  return getUserByEmail(user.email);
}

async function updateUserProfile(email, updates) {
  if (!isAvailable || !pool) return null;
  const user = await getUserByEmail(email);
  if (!user) return null;

  const name = updates.name !== undefined ? updates.name : user.name;
  const phone = updates.phone !== undefined ? updates.phone : user.phone;
  const address = updates.address !== undefined ? updates.address : user.address;
  const password = updates.password ? updates.password : user.password;

  await pool.query(
    'UPDATE users SET name = ?, phone = ?, address = ?, password = ? WHERE LOWER(email) = LOWER(?)',
    [name, phone, address, password, email]
  );
  return getUserByEmail(email);
}

async function getAdmin() {
  if (!isAvailable || !pool) return null;
  const [rows] = await pool.query('SELECT * FROM admins LIMIT 1');
  if (rows.length === 0) return null;
  return rows[0];
}

async function updateAdminPassword(newPassword) {
  if (!isAvailable || !pool) return false;
  await pool.query('UPDATE admins SET password = ? LIMIT 1', [newPassword]);
  return true;
}

module.exports = {
  initDatabase,
  get isAvailable() { return isAvailable; },
  get pool() { return pool; },
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getInquiries,
  createInquiry,
  updateInquiry,
  getUserByEmail,
  createUser,
  updateUserProfile,
  getAdmin,
  updateAdminPassword
};
