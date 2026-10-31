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

// GET API: Fetches plain menu entries directly from your VARCHAR schema layout
//app.get('/api/menu', async (req, res) => {
  app.get(['/api/menu', '/api/kiosk/menu'], async (req, res) => {
  try {
    const query = `
      SELECT 
        itemid,
        item_name,
        item_cal,
        item_cost,
        item_category,
        base_item_type,
        1 as inventory_count
      FROM menu
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

app.use(express.static(buildDirectory));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(buildDirectory, "index.html"));
});

app.listen(port, () => {
  console.log(`Pearl Garden backend server is listening on port ${port}`);
});
