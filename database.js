import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./aura.db', (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to local database: aura.db');
});

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

export async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    type TEXT,
    rate REAL,
    status TEXT,
    capacity INTEGER
  )`);

  await run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    room TEXT,
    check_in TEXT,
    check_out TEXT,
    status TEXT,
    paid INTEGER,
    amount REAL,
    FOREIGN KEY(room) REFERENCES rooms(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS housekeeping (
    id TEXT PRIMARY KEY,
    room TEXT,
    assignee TEXT,
    priority TEXT,
    status TEXT,
    FOREIGN KEY(room) REFERENCES rooms(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    room TEXT,
    item TEXT,
    qty INTEGER,
    total REAL,
    status TEXT,
    FOREIGN KEY(room) REFERENCES rooms(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    stock INTEGER,
    min INTEGER
  )`);

  await run(`CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    shift TEXT,
    status TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    time TEXT
  )`);

  const roomCount = await get('SELECT COUNT(*) as count FROM rooms');
  if (roomCount.count === 0) {
    for (let i = 0; i < 12; i++) {
      const id = String(101 + i);
      const type = i > 8 ? 'Presidential suite' : i > 4 ? 'Executive suite' : 'Deluxe room';
      const rate = i > 8 ? 14500 : i > 4 ? 8500 : 4800;
      const status = i < 4 ? 'Occupied' : i === 7 ? 'Dirty' : i === 11 ? 'Maintenance' : 'Available';
      const capacity = i > 8 ? 4 : 2;
      await run('INSERT INTO rooms VALUES (?, ?, ?, ?, ?)', [id, type, rate, status, capacity]);
    }

    const inventoryItems = [
      ['I1', 'Bath towels', 'Housekeeping', 84, 30],
      ['I2', 'Shampoo bottles', 'Amenities', 18, 25],
      ['I3', 'Coffee capsules', 'Food & beverage', 120, 40],
      ['I4', 'Bed linen sets', 'Housekeeping', 22, 25]
    ];
    for (const item of inventoryItems) {
      await run('INSERT INTO inventory VALUES (?, ?, ?, ?, ?)', item);
    }

    const staffMembers = [
      ['S1', 'Maya Patel', 'Housekeeping', '07:00 – 15:00', 'On duty'],
      ['S2', 'Daniel Kim', 'Front desk', '08:00 – 16:00', 'On duty'],
      ['S3', 'Sofia Rossi', 'Restaurant', '12:00 – 20:00', 'Off duty'],
      ['S4', 'James Carter', 'Maintenance', '09:00 – 17:00', 'On duty']
    ];
    for (const member of staffMembers) {
      await run('INSERT INTO staff VALUES (?, ?, ?, ?, ?)', member);
    }

    await run('INSERT INTO activity (text, time) VALUES (?, ?)', [
      'Property initialized with verified inventory and rooms',
      new Date().toISOString()
    ]);
  }
}