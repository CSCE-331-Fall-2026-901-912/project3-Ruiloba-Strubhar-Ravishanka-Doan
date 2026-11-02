import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const buildDirectory = path.join(currentDirectory, "dist");

app.use(express.json());

// PostgreSQL Connection Pool Configuration Matrix
const pool = new Pool({
  host: 'csce-315-db.engr.tamu.edu',
  port: 5432,
  database: 'squad_12_db',
  user: 'squad_12',
  password: 'Boba26$$$$',
  ssl: {
    rejectUnauthorized: false
  }
});

// Health check checkpoint
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// GET API: Fetch menu items for the website and kiosk
app.get(['/api/menu', '/api/kiosk/menu'], async (req, res) => {
  try {
    /* 🌟 FIXED: Unified into a single route handler that joins against 'M_cups' 
       to bypass the string name/underscore formatting mismatch between tables */
    const query = `
      SELECT m.*, COALESCE(i.supply_qty, 100) as inventory_count 
      FROM menu m
      LEFT JOIN inventory i ON i.supply_name = 'M_cups'
    `;
    const result = await pool.query(query);
    //res.json(result.rows);
    if (req.path === '/api/kiosk/menu') {
      const drinks = result.rows.filter(
        item =>
          item.item_category === 'base_drink' ||
          item.item_category === 'seasonal_drink'
      );

      const toppings = result.rows.filter(
        item => item.item_category === 'topping'
      );

      res.json({ drinks, toppings });
    } else {
      res.json(result.rows);
    }
  } catch (err) {
    console.error("Database selection runtime failure:", err);
    res.status(500).json({ error: 'Failed to retrieve menu rows' });
  }
});

// POST API: Finalizes item orders inside a safe transaction boundary
app.post('/api/orders', async (req, res) => {
  const { items, subtotal, tax, tip, total } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Generate the next incremental order identity signature securely
    const idResult = await client.query('SELECT MAX(orderid) FROM order_history');

    // Safely parse the MAX string mapping from row object arrays
    const maxId = idResult.rows[0] ? idResult.rows[0].max : null;
    const newOrderId = maxId ? parseInt(maxId, 10) + 1 : 1;

    const currentTime = new Date();
    const serverName = "Cashier Portal";
    const fallbackPhone = "000-000-0000";
    const fallbackPayType = "counter";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isFirstItemRow = (i === 0);

      const insertQuery = `
        INSERT INTO order_history (
          orderid, item_cost_subtotal, phone_number, pay_type, time, 
          drink_name, topping, item_quantity, item_size, tips, tax, total, server
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

      const values = [
        newOrderId,
        parseFloat((item.item_cost * item.quantity).toFixed(2)),
        fallbackPhone,
        fallbackPayType,
        currentTime,
        item.drink_name || item.item_name,
        item.topping || 'None',
        item.quantity,
        item.size,
        isFirstItemRow ? parseFloat(tip || 0) : null,
        isFirstItemRow ? parseFloat(tax || 0) : null,
        isFirstItemRow ? parseFloat(total || 0) : null,
        serverName
      ];

      await client.query(insertQuery, values);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, orderId: newOrderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Order processing pipeline failure:", err);
    res.status(500).json({ error: 'Order processing pipeline failure' });
  } finally {
    client.release();
  }
});

// Customer kiosk checkout (separate from the cashier endpoint)
app.post('/api/kiosk/orders', async (req, res) => {
  const { items, tip = 0 } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) return res.status(400).json({ error: 'Please add a drink.' });
  const tipCents = Math.round(Number(tip) * 100);
  if (!Number.isSafeInteger(tipCents) || tipCents < 0 || tipCents > 100000) return res.status(400).json({ error: 'Invalid tip.' });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [3312026]);
    const idResult = await client.query('SELECT COALESCE(MAX(orderid), 0) AS max_id FROM order_history');
    const orderId = Number(idResult.rows[0].max_id) + 1;
    let subtotalCents = 0;
    const lines = [];
    for (const item of items) {
      const drinkId = Number(item.drinkId), quantity = Number(item.quantity);
      const toppingId = item.toppingId == null ? null : Number(item.toppingId);
      const size = item.size;
      if (!Number.isSafeInteger(drinkId) || drinkId < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 || !['M','L'].includes(size) || (toppingId !== null && (!Number.isSafeInteger(toppingId) || toppingId < 1))) throw new Error('Invalid drink selection');
      const drinkResult = await client.query("SELECT item_name, item_cost FROM menu WHERE itemid = $1 AND item_category IN ('base_drink', 'seasonal_drink')", [drinkId]);
      if (!drinkResult.rows.length) throw new Error('Drink not found');
      const drink = drinkResult.rows[0];
      let toppingName = 'None', toppingCents = 0;
      if (toppingId !== null) {
        const toppingResult = await client.query("SELECT item_name, item_cost FROM menu WHERE itemid = $1 AND item_category = 'topping'", [toppingId]);
        if (!toppingResult.rows.length) throw new Error('Topping not found');
        toppingName = toppingResult.rows[0].item_name;
        toppingCents = Math.round(Number(toppingResult.rows[0].item_cost) * 100);
      }
      const lineCents = (Math.round(Number(drink.item_cost) * 100) + toppingCents + (size === 'L' ? 50 : 0)) * quantity;
      if (!Number.isSafeInteger(lineCents) || lineCents < 0) throw new Error('Invalid price');
      subtotalCents += lineCents;
      lines.push({ drinkName: drink.item_name, toppingName, quantity, size, lineSubtotal: lineCents / 100 });
    }
    const taxCents = Math.round(subtotalCents * 0.0825);
    const totalCents = subtotalCents + taxCents + tipCents;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i], last = i === lines.length - 1;
      await client.query(`INSERT INTO order_history (orderid, item_cost_subtotal, phone_number, pay_type, time, drink_name, topping, item_quantity, item_size, tips, tax, total, server)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [orderId, line.lineSubtotal, '000-000-0000', 'kiosk', new Date(), line.drinkName, line.toppingName, line.quantity, line.size, last ? tipCents/100 : null, last ? taxCents/100 : null, last ? totalCents/100 : null, 'customer-kiosk']);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, orderId, items: lines, subtotal: subtotalCents/100, tax: taxCents/100, tip: tipCents/100, total: totalCents/100 });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Kiosk order error:', error);
    res.status(['Invalid drink selection','Drink not found','Topping not found','Invalid price'].includes(error.message) ? 400 : 500).json({ error: ['Invalid drink selection','Drink not found','Topping not found','Invalid price'].includes(error.message) ? error.message : 'Unable to save kiosk order' });
  } finally { if (client) client.release(); }
});

// Fallback static resource router pipeline layer
app.use(express.static(buildDirectory));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(buildDirectory, "index.html"));
});

app.listen(port, () => {
  console.log(`Pearl Garden backend server is listening on port ${port}`);
});
