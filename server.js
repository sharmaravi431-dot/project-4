import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, run, all, get } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uid = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex')}`;

async function logActivity(text) {
  await run('INSERT INTO activity (text, time) VALUES (?, ?)', [text, new Date().toISOString()]);
}

// Full State API Endpoint
app.get('/api/state', async (req, res) => {
  try {
    const [rooms, bookings, tasks, inventory, staff, orders, activity] = await Promise.all([
      all('SELECT * FROM rooms'),
      all('SELECT * FROM bookings'),
      all('SELECT * FROM housekeeping'),
      all('SELECT * FROM inventory'),
      all('SELECT * FROM staff'),
      all('SELECT * FROM orders'),
      all('SELECT text, time FROM activity ORDER BY id DESC LIMIT 20')
    ]);

    res.json({
      hotel: 'The Grand Aura',
      rooms,
      bookings: bookings.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        room: b.room,
        in: b.check_in,
        out: b.check_out,
        status: b.status,
        paid: Boolean(b.paid),
        amount: b.amount
      })),
      tasks,
      inventory,
      staff,
      orders,
      activity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bookings / Reservations
app.post('/api/bookings', async (req, res) => {
  const { name, email, check_in, check_out, room } = req.body;
  if (!name || !email || !check_in || !check_out || !room) {
    return res.status(400).json({ error: 'All reservation fields are required.' });
  }

  try {
    const targetRoom = await get('SELECT * FROM rooms WHERE id = ?', [room]);
    if (!targetRoom || targetRoom.status === 'Maintenance') {
      return res.status(400).json({ error: 'Room is unavailable.' });
    }

    const overlap = await get(
      `SELECT id FROM bookings 
       WHERE room = ? 
       AND status != 'Checked out' 
       AND check_in < ? 
       AND check_out > ?`,
      [room, check_out, check_in]
    );

    if (overlap) {
      return res.status(409).json({ error: 'Overlapping reservation exists for this room and dates.' });
    }

    const nights = Math.round((Date.parse(check_out) - Date.parse(check_in)) / 86400000);
    const amount = nights * targetRoom.rate;
    const bookingId = uid('BK');

    await run(
      `INSERT INTO bookings (id, name, email, room, check_in, check_out, status, paid, amount) 
       VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', 0, ?)`,
      [bookingId, name.trim(), email.trim(), room, check_in, check_out, amount]
    );

    await logActivity(`Reservation created for ${name.trim()}`);
    res.status(201).json({ success: true, id: bookingId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/:id/checkin', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const room = await get('SELECT * FROM rooms WHERE id = ?', [booking.room]);
    if (room.status !== 'Available') {
      return res.status(400).json({ error: 'Room is not clean or available.' });
    }

    await run('UPDATE bookings SET status = "Checked in" WHERE id = ?', [id]);
    await run('UPDATE rooms SET status = "Occupied" WHERE id = ?', [booking.room]);
    await logActivity(`${booking.name} checked into room ${booking.room}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/:id/checkout', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (!booking.paid) {
      return res.status(400).json({ error: 'Payment pending. Clear room charge first.' });
    }

    const pendingOrders = await get(
      'SELECT id FROM orders WHERE room = ? AND status = "Preparing"',
      [booking.room]
    );
    if (pendingOrders) {
      return res.status(400).json({ error: 'Pending room service order must be fulfilled.' });
    }

    await run('UPDATE bookings SET status = "Checked out" WHERE id = ?', [id]);
    await run('UPDATE rooms SET status = "Dirty" WHERE id = ?', [booking.room]);

    const taskId = uid('HK');
    await run(
      'INSERT INTO housekeeping (id, room, assignee, priority, status) VALUES (?, ?, "Maya Patel", "High", "Pending")',
      [taskId, booking.room]
    );

    await logActivity(`Room ${booking.room} checked out; cleaning task initiated`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/:id/pay', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    await run('UPDATE bookings SET paid = 1 WHERE id = ?', [id]);
    await logActivity(`Payment cleared for ${booking.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Housekeeping
app.patch('/api/housekeeping/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await get('SELECT * FROM housekeeping WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const nextStatus = task.status === 'Pending' ? 'In progress' : 'Ready';
    await run('UPDATE housekeeping SET status = ? WHERE id = ?', [nextStatus, id]);

    if (nextStatus === 'Ready') {
      await run('UPDATE rooms SET status = "Available" WHERE id = ?', [task.room]);
    }

    await logActivity(`Housekeeping Room ${task.room}: ${nextStatus}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders
app.post('/api/orders', async (req, res) => {
  const { room, item, qty, total } = req.body;
  try {
    const orderId = uid('ORD');
    await run(
      'INSERT INTO orders (id, room, item, qty, total, status) VALUES (?, ?, ?, ?, ?, "Preparing")',
      [orderId, room, item, qty, total]
    );
    await logActivity(`Room service scheduled for Room ${room}`);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/deliver', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await run('UPDATE orders SET status = "Delivered" WHERE id = ?', [id]);
    await logActivity(`Order delivered to Room ${order.room}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
app.post('/api/inventory/:id/restock', async (req, res) => {
  const { id } = req.params;
  try {
    await run('UPDATE inventory SET stock = stock + 10 WHERE id = ?', [id]);
    const item = await get('SELECT name FROM inventory WHERE id = ?', [id]);
    await logActivity(`Restocked 10 units of ${item.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff
app.patch('/api/staff/:id/shift', async (req, res) => {
  const { id } = req.params;
  try {
    const member = await get('SELECT * FROM staff WHERE id = ?', [id]);
    if (!member) return res.status(404).json({ error: 'Staff record missing.' });

    const newStatus = member.status === 'On duty' ? 'Off duty' : 'On duty';
    await run('UPDATE staff SET status = ? WHERE id = ?', [newStatus, id]);
    await logActivity(`${member.name} went ${newStatus.toLowerCase()}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback: serve UI for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`AURA Hotel System active on http://localhost:${PORT}`);
  });
});