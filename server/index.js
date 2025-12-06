
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// --- Configuration ---
const PORT = 3001;
const SECRET_KEY = 'finance-pro-secret-key-change-this-in-production';
const DB_PATH = path.join(__dirname, 'finance.db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Database Setup ---
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // 1. Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT
    )`);

    // 2. Accounts (COA)
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      type TEXT
    )`);

    // 3. Vouchers (Headers)
    db.run(`CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      voucher_number TEXT,
      date TEXT,
      description TEXT,
      status TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 4. Journal Entries (Lines)
    db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      voucher_id TEXT,
      account_id TEXT,
      debit REAL,
      credit REAL,
      FOREIGN KEY(voucher_id) REFERENCES vouchers(id)
    )`);

    // 5. Assets
    db.run(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT,
      purchase_date TEXT,
      original_value REAL,
      salvage_value REAL,
      life_years INTEGER,
      accumulated_depreciation REAL
    )`);

    // 6. Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    // 7. Audit Logs
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      user_id TEXT,
      user_name TEXT,
      action TEXT,
      entity TEXT,
      details TEXT,
      changes TEXT
    )`);

    // Seed Admin User (admin@company.com / admin123)
    const adminId = 'u_admin';
    const adminPass = bcrypt.hashSync('admin123', 8);
    db.run(`INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
      [adminId, 'admin@company.com', adminPass, 'Administrator', 'admin']
    );
    
    // Seed Settings
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['companyName', 'My Enterprise']);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['currency', '¥']);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['language', 'zh']);
    
    console.log('Database initialized.');
  });
}

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
});

// 2. Bootstrap (Get All Initial Data)
app.get('/api/bootstrap', authenticateToken, (req, res) => {
  const data = { accounts: [], vouchers: [], fixedAssets: [], settings: {} };

  db.all('SELECT * FROM accounts', [], (err, rows) => {
    if (err) return res.status(500).send(err);
    data.accounts = rows;
    
    db.all('SELECT * FROM vouchers ORDER BY date DESC', [], (err, vRows) => {
        if (err) return res.status(500).send(err);
        
        // Need to join entries
        const promises = vRows.map(v => new Promise((resolve) => {
            db.all('SELECT * FROM journal_entries WHERE voucher_id = ?', [v.id], (err, eRows) => {
                v.entries = eRows.map(e => ({ accountId: e.account_id, debit: e.debit, credit: e.credit }));
                resolve(v);
            });
        }));

        Promise.all(promises).then(fullVouchers => {
            data.vouchers = fullVouchers.map(v => ({
                id: v.id, voucherNumber: v.voucher_number, date: v.date, 
                description: v.description, status: v.status, createdBy: v.created_by,
                entries: v.entries
            }));

            db.all('SELECT * FROM assets', [], (err, aRows) => {
                data.fixedAssets = aRows.map(a => ({
                    id: a.id, name: a.name, purchaseDate: a.purchase_date,
                    originalValue: a.original_value, salvageValue: a.salvage_value,
                    lifeYears: a.life_years, accumulatedDepreciation: a.accumulated_depreciation,
                    method: 'straight-line'
                }));

                db.all('SELECT * FROM settings', [], (err, sRows) => {
                    sRows.forEach(s => data.settings[s.key] = s.value);
                    res.json(data);
                });
            });
        });
    });
  });
});

// 3. Vouchers
app.post('/api/vouchers', authenticateToken, (req, res) => {
  const { date, description, entries, status } = req.body;
  
  // Basic validation
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({ error: 'Unbalanced voucher' });
  }

  const id = uuidv4();
  // Simple voucher number gen
  const dateStr = date.replace(/-/g, '');
  const voucherNumber = `V-${dateStr}-${Math.floor(Math.random() * 1000)}`;

  db.run(`INSERT INTO vouchers (id, voucher_number, date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, voucherNumber, date, description, status || 'draft', req.user.name],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const stmt = db.prepare(`INSERT INTO journal_entries (id, voucher_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)`);
      entries.forEach(e => {
        stmt.run(uuidv4(), id, e.accountId, e.debit, e.credit);
      });
      stmt.finalize();

      res.json({ id, voucherNumber, message: 'Voucher created' });
    }
  );
});

app.put('/api/vouchers/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    db.run('UPDATE vouchers SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

// 4. Assets
app.post('/api/assets', authenticateToken, (req, res) => {
    const asset = req.body;
    const id = uuidv4();
    db.run(`INSERT INTO assets (id, name, purchase_date, original_value, salvage_value, life_years, accumulated_depreciation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, asset.name, asset.purchaseDate, asset.originalValue, asset.salvageValue, asset.lifeYears, 0],
      function(err) {
        if(err) return res.status(500).json({error: err.message});
        res.json({id, message: 'Asset created'});
      }
    );
});

// 5. Settings
app.put('/api/settings', authenticateToken, (req, res) => {
    const settings = req.body; // { companyName: '...', currency: '...' }
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.keys(settings).forEach(key => {
        stmt.run(key, String(settings[key]));
    });
    stmt.finalize();
    res.json({ message: 'Settings updated' });
});

// Start
app.listen(PORT, () => {
  console.log(`Finance Manager Backend running on http://localhost:${PORT}`);
  console.log(`Default Admin: admin@company.com / admin123`);
});
