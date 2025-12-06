
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'finance-pro-secret-key-change-this-in-production';
const DB_PATH = path.join(__dirname, 'finance.db');

// Email Config (163 Mail)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS || 'EYwnKjX4WtJvcWcH'; // Provided auth code

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Security: Rate Limiter ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth/', loginLimiter);

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

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

    // 2. Verification Codes
    db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT PRIMARY KEY,
      code TEXT,
      expires_at INTEGER
    )`);

    // 3. Accounts (COA)
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      type TEXT
    )`);

    // 4. Vouchers (Headers)
    db.run(`CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      voucher_number TEXT,
      date TEXT,
      description TEXT,
      status TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 5. Journal Entries (Lines)
    db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      voucher_id TEXT,
      account_id TEXT,
      debit REAL,
      credit REAL,
      FOREIGN KEY(voucher_id) REFERENCES vouchers(id)
    )`);

    // 6. Assets
    db.run(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT,
      purchase_date TEXT,
      original_value REAL,
      salvage_value REAL,
      life_years INTEGER,
      accumulated_depreciation REAL
    )`);

    // 7. Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    // 8. Audit Logs
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

    // 9. Manual Balance Items
    db.run(`CREATE TABLE IF NOT EXISTS balance_items (
      id TEXT PRIMARY KEY,
      name TEXT,
      amount REAL,
      type TEXT
    )`);

    // Seed Admin User
    const adminId = 'u_admin';
    const adminPass = bcrypt.hashSync('admin123', 8);
    db.run(`INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
      [adminId, 'admin@company.com', adminPass, 'Administrator', 'admin']
    );
    
    // Seed Default Settings
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['companyName', 'My Enterprise']);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['currency', '¥']);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, ['language', 'zh']);
    
    console.log('Database initialized.');
  });
}

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array() });
  };
};

const logAudit = (userId, userName, action, entity, details, changes) => {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.run(`INSERT INTO audit_logs (id, timestamp, user_id, user_name, action, entity, details, changes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, timestamp, userId, userName, action, entity, details, JSON.stringify(changes || [])]
  );
};

// --- Routes ---

// 1. Auth: Send Verification Code
app.post('/api/auth/send-code',
  validate([body('email').isEmail()]),
  (req, res) => {
    if (!EMAIL_USER) {
      return res.status(500).json({ error: 'Server email not configured. Please check .env file.' });
    }
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    db.run(`INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)`,
      [email, code, expiresAt],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const mailOptions = {
          from: `"Finance Manager" <${EMAIL_USER}>`,
          to: email,
          subject: '您的注册验证码 - 财务管理员',
          text: `您的验证码是: ${code}。有效期5分钟，请勿泄露给他人。`,
          html: `<div style="padding: 20px; background: #f9fafb; font-family: sans-serif;">
                   <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid #eee;">
                     <h2 style="color: #4f46e5; margin-bottom: 20px;">财务管理员验证码</h2>
                     <p style="font-size: 16px; color: #374151;">您好，</p>
                     <p style="color: #6b7280; line-height: 1.5;">您正在注册或登录财务管理员系统。您的验证码是：</p>
                     <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0; border-radius: 8px;">
                       ${code}
                     </div>
                     <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">此验证码 5 分钟内有效。</p>
                   </div>
                 </div>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Send mail error:", error);
            return res.status(500).json({ error: '发送邮件失败，请检查服务器邮箱配置' });
          }
          console.log('Message sent: %s', info.messageId);
          res.json({ message: 'Code sent successfully' });
        });
      }
    );
  }
);

// 1. Auth: Register
app.post('/api/auth/register',
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('code').isLength({ min: 6 }),
    body('name').notEmpty()
  ]),
  (req, res) => {
    const { email, password, code, name } = req.body;

    db.get('SELECT * FROM verification_codes WHERE email = ?', [email], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(400).json({ error: '无效的验证码' });
      if (Date.now() > row.expires_at) return res.status(400).json({ error: '验证码已过期' });
      if (row.code !== code) return res.status(400).json({ error: '验证码错误' });

      db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (user) return res.status(400).json({ error: '该邮箱已注册' });

        const id = uuidv4();
        const hashedPass = bcrypt.hashSync(password, 8);
        const role = 'staff'; // Default role

        db.run(`INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
          [id, email, hashedPass, name, role],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Clean up code
            db.run('DELETE FROM verification_codes WHERE email = ?', [email]);

            const token = jwt.sign({ id, email, name, role }, SECRET_KEY, { expiresIn: '24h' });
            logAudit(id, name, 'create', 'user', '新用户注册', []);
            res.json({ token, user: { id, email, name, role } });
          }
        );
      });
    });
  }
);

// 1. Auth: Login
app.post('/api/auth/login', 
  validate([
    body('email').isEmail(),
    body('password').isLength({ min: 5 })
  ]),
  (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: '用户不存在' });

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) return res.status(401).json({ error: '密码错误' });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
      logAudit(user.id, user.name, 'login', 'user', '用户登录成功', []);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    });
});

// 2. Bootstrap Data
app.get('/api/bootstrap', authenticateToken, (req, res) => {
  const data = { accounts: [], vouchers: [], fixedAssets: [], settings: {}, auditLogs: [], assets: [], liabilities: [] };

  db.serialize(() => {
    db.all('SELECT * FROM accounts', (err, rows) => data.accounts = rows || []);
    db.all('SELECT * FROM assets', (err, rows) => {
        data.fixedAssets = rows.map(a => ({
            id: a.id, name: a.name, purchaseDate: a.purchase_date,
            originalValue: a.original_value, salvageValue: a.salvage_value,
            lifeYears: a.life_years, accumulatedDepreciation: a.accumulated_depreciation,
            method: 'straight-line'
        })) || [];
    });
    db.all('SELECT * FROM settings', (err, rows) => {
        if(rows) rows.forEach(s => data.settings[s.key] = s.value);
        if(!data.settings.incomeCategories) data.settings.incomeCategories = ['学费收入', '咨询服务'];
        if(!data.settings.expenseCategories) data.settings.expenseCategories = ['房租物业', '工资薪金'];
    });
    db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
        data.auditLogs = rows.map(r => ({
            ...r, userId: r.user_id, userName: r.user_name, changes: JSON.parse(r.changes || '[]')
        })) || [];
    });
    db.all('SELECT * FROM balance_items', (err, rows) => {
        if(rows) {
            data.assets = rows.filter(r => r.type === 'asset');
            data.liabilities = rows.filter(r => r.type === 'liability');
        }
    });
    
    db.all('SELECT * FROM vouchers ORDER BY date DESC', [], (err, vRows) => {
        if (err) return res.status(500).send(err);
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
            res.json(data);
        });
    });
  });
});

// 3. Vouchers
app.post('/api/vouchers', authenticateToken, validate([body('description').notEmpty()]), (req, res) => {
    const { date, description, entries, status, createdBy } = req.body;
    const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) return res.status(400).json({ error: 'Unbalanced voucher' });

    const id = uuidv4();
    const dateStr = date.replace(/-/g, '');
    const voucherNumber = `V-${dateStr}-${Math.floor(Math.random() * 10000)}`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO vouchers (id, voucher_number, date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, voucherNumber, date, description, status || 'draft', createdBy || req.user.name]
        );
        const stmt = db.prepare(`INSERT INTO journal_entries (id, voucher_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)`);
        entries.forEach(e => { stmt.run(uuidv4(), id, e.accountId, e.debit, e.credit); });
        stmt.finalize();
        db.run('COMMIT');
        logAudit(req.user.id, req.user.name, 'create', 'voucher', `创建凭证 ${voucherNumber}`, [{field: 'amount', oldValue: null, newValue: totalDebit}]);
        res.json({ id, voucherNumber, message: 'Voucher created' });
    });
});

app.put('/api/vouchers/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    db.run('UPDATE vouchers SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        logAudit(req.user.id, req.user.name, 'approve', 'voucher', `更新凭证状态 ${status}`, []);
        res.json({ message: 'Status updated' });
    });
});

// 4. Assets & Depreciation
app.post('/api/assets/run-depreciation', authenticateToken, (req, res) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const sysVoucherPrefix = `SYS-DEP-${currentMonth}`;
    db.get('SELECT id FROM vouchers WHERE voucher_number LIKE ?', [`${sysVoucherPrefix}%`], (err, row) => {
        if(row) return res.status(400).json({ error: '本月折旧已计提' });
        db.all('SELECT * FROM assets', (err, assets) => {
            if(err) return res.status(500).json({error: err.message});
            let totalDep = 0;
            const updates = [];
            assets.forEach(asset => {
                const monthlyDep = (asset.original_value - asset.salvage_value) / (asset.life_years * 12);
                const remainingValue = asset.original_value - asset.salvage_value - asset.accumulated_depreciation;
                if (remainingValue > 0) {
                    const actualDep = Math.min(monthlyDep, remainingValue);
                    if(actualDep > 0) {
                        totalDep += actualDep;
                        updates.push({ id: asset.id, newAcc: asset.accumulated_depreciation + actualDep });
                    }
                }
            });
            if (totalDep === 0) return res.json({ message: 'No depreciation needed', amount: 0 });
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                const vId = uuidv4();
                db.run(`INSERT INTO vouchers (id, voucher_number, date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
                    [vId, `${sysVoucherPrefix}-001`, new Date().toISOString().slice(0, 10), `系统计提折旧: ${currentMonth}`, 'posted', 'SYSTEM']
                );
                const stmt = db.prepare('UPDATE assets SET accumulated_depreciation = ? WHERE id = ?');
                updates.forEach(u => stmt.run(u.newAcc, u.id));
                stmt.finalize();
                db.run('COMMIT');
                logAudit(req.user.id, req.user.name, 'create', 'asset', `执行系统折旧 ${currentMonth}`, [{field: 'total', oldValue: 0, newValue: totalDep}]);
                res.json({ message: 'Depreciation completed', amount: totalDep });
            });
        });
    });
});

app.post('/api/assets', authenticateToken, (req, res) => {
    const asset = req.body;
    const id = uuidv4();
    db.run(`INSERT INTO assets (id, name, purchase_date, original_value, salvage_value, life_years, accumulated_depreciation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, asset.name, asset.purchaseDate, asset.originalValue, asset.salvageValue, asset.lifeYears, 0],
      function(err) {
        if(err) return res.status(500).json({error: err.message});
        res.json({id});
      }
    );
});

// 5. Settings & Closing
app.put('/api/settings', authenticateToken, (req, res) => {
    const settings = req.body; 
    db.serialize(() => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        Object.keys(settings).forEach(key => { stmt.run(key, String(settings[key])); });
        stmt.finalize();
        logAudit(req.user.id, req.user.name, 'update', 'settings', '更新系统设置', []);
        res.json({ message: 'Settings updated' });
    });
});

app.post('/api/closing', authenticateToken, (req, res) => {
    const { year, month, entries } = req.body;
    const id = uuidv4();
    const dateStr = `${year}-${String(month).padStart(2,'0')}`;
    const voucherNumber = `SYS-CLOSE-${dateStr.replace('-','')}`;
    const lastDay = new Date(year, month, 0).getDate();
    const date = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO vouchers (id, voucher_number, date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, voucherNumber, date, `月末结转: ${dateStr}`, 'posted', 'SYSTEM']
        );
        const stmt = db.prepare(`INSERT INTO journal_entries (id, voucher_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)`);
        entries.forEach(e => { stmt.run(uuidv4(), id, e.accountId, e.debit, e.credit); });
        stmt.finalize();
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['lockDate', date]);
        db.run('COMMIT');
        logAudit(req.user.id, req.user.name, 'create', 'voucher', `执行月末结账 ${dateStr}`, []);
        res.json({ message: 'Closing completed' });
    });
});

app.get('/api/audit-logs', authenticateToken, (req, res) => {
    db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100', [], (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows.map(r => ({ ...r, userId: r.user_id, userName: r.user_name, changes: JSON.parse(r.changes || '[]') })));
    });
});

app.post('/api/accounts', authenticateToken, (req, res) => {
    const { code, name, type } = req.body;
    const id = uuidv4();
    db.run('INSERT INTO accounts (id, code, name, type) VALUES (?, ?, ?, ?)', [id, code, name, type], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({id});
    });
});

app.post('/api/balance-items', authenticateToken, (req, res) => {
    const { name, amount, type } = req.body;
    const id = uuidv4();
    db.run('INSERT INTO balance_items (id, name, amount, type) VALUES (?, ?, ?, ?)', [id, name, amount, type], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({id});
    });
});

app.delete('/api/balance-items/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM balance_items WHERE id = ?', [req.params.id], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({message: 'Deleted'});
    });
});

app.listen(PORT, () => {
  console.log(`Finance Manager Backend running on http://localhost:${PORT}`);
});
