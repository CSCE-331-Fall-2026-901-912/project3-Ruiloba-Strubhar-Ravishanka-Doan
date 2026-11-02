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

// Helper: normalize date range for report queries
function reportDateRange(req) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const start = (req.query.start || req.query.startDate || defaultStart);
  const end = (req.query.end || req.query.endDate || today);
  return { start, end };
}

// POST API: Add a new menu item
app.post('/api/menu', async (req, res) => {
  const { item_name, item_cal, item_cost, item_category, base_item_type } = req.body || {};
  if (!item_name || !item_category) {
    return res.status(400).json({ error: 'item_name and item_category are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO menu (item_name, item_cal, item_cost, item_category, base_item_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [String(item_name).trim(), Number(item_cal) || 0, Number(item_cost) || 0, String(item_category).trim(), base_item_type ? String(base_item_type).trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Menu insert failure:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// PUT API: Update an existing menu item
app.put('/api/menu/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid item id' });
  const { item_name, item_cal, item_cost, item_category, base_item_type } = req.body || {};
  const fields = [];
  const values = [];
  let idx = 1;
  if (item_name !== undefined) { fields.push(`item_name = $${idx++}`); values.push(String(item_name).trim()); }
  if (item_cal !== undefined) { fields.push(`item_cal = $${idx++}`); values.push(Number(item_cal) || 0); }
  if (item_cost !== undefined) { fields.push(`item_cost = $${idx++}`); values.push(Number(item_cost) || 0); }
  if (item_category !== undefined) { fields.push(`item_category = $${idx++}`); values.push(String(item_category).trim()); }
  if (base_item_type !== undefined) { fields.push(`base_item_type = $${idx++}`); values.push(base_item_type === null || base_item_type === '' ? null : String(base_item_type).trim()); }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(id);
  try {
    const result = await pool.query(`UPDATE menu SET ${fields.join(', ')} WHERE itemid = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Menu update failure:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE API: Remove a menu item
app.delete('/api/menu/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid item id' });
  try {
    const result = await pool.query('DELETE FROM menu WHERE itemid = $1 RETURNING itemid', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Menu delete failure:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// GET API: Sales summary report
app.get('/api/reports/sales-summary', async (req, res) => {
  const { start, end } = reportDateRange(req);
  try {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT orderid) AS orders,
              COALESCE(SUM(total) FILTER (WHERE total IS NOT NULL), 0) AS revenue,
              COALESCE(SUM(item_cost_subtotal), 0) AS item_revenue,
              COALESCE(SUM(tax) FILTER (WHERE tax IS NOT NULL), 0) AS tax,
              COALESCE(SUM(tips) FILTER (WHERE tips IS NOT NULL), 0) AS tips
       FROM order_history
       WHERE time::date BETWEEN $1::date AND $2::date`,
      [start, end]
    );
    const row = result.rows[0] || {};
    const orders = Number(row.orders) || 0;
    const revenue = Number(row.revenue) || 0;
    res.json({
      startDate: start,
      endDate: end,
      totalOrders: orders,
      totalRevenue: revenue,
      itemRevenue: Number(row.item_revenue) || 0,
      tax: Number(row.tax) || 0,
      tips: Number(row.tips) || 0,
      averageOrder: orders ? revenue / orders : 0,
    });
  } catch (err) {
    console.error('Sales summary failure:', err);
    res.status(500).json({ error: 'Failed to generate sales summary' });
  }
});

// GET API: Sales by day report (for visualization)
app.get('/api/reports/sales-by-day', async (req, res) => {
  const { start, end } = reportDateRange(req);
  try {
    const result = await pool.query(
      `SELECT time::date AS day,
              COUNT(DISTINCT orderid) AS orders,
              COALESCE(SUM(total) FILTER (WHERE total IS NOT NULL), 0) AS revenue,
              COALESCE(SUM(item_cost_subtotal), 0) AS item_revenue
       FROM order_history
       WHERE time::date BETWEEN $1::date AND $2::date
       GROUP BY time::date
       ORDER BY day`,
      [start, end]
    );
    res.json(result.rows.map(r => ({
      date: r.day,
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
      itemRevenue: Number(r.item_revenue) || 0,
    })));
  } catch (err) {
    console.error('Sales by day failure:', err);
    res.status(500).json({ error: 'Failed to generate sales by day report' });
  }
});

// GET API: Top selling items report
app.get('/api/reports/top-items', async (req, res) => {
  const { start, end } = reportDateRange(req);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  try {
    const result = await pool.query(
      `SELECT drink_name,
              COALESCE(SUM(item_quantity), 0) AS quantity,
              COALESCE(SUM(item_cost_subtotal), 0) AS revenue
       FROM order_history
       WHERE time::date BETWEEN $1::date AND $2::date
       GROUP BY drink_name
       ORDER BY quantity DESC
       LIMIT $3`,
      [start, end, limit]
    );
    res.json(result.rows.map(r => ({
      name: r.drink_name,
      quantity: Number(r.quantity) || 0,
      revenue: Number(r.revenue) || 0,
    })));
  } catch (err) {
    console.error('Top items failure:', err);
    res.status(500).json({ error: 'Failed to generate top items report' });
  }
});

// GET API: Payment method breakdown report
app.get('/api/reports/payment-methods', async (req, res) => {
  const { start, end } = reportDateRange(req);
  try {
    const result = await pool.query(
      `SELECT pay_type,
              COUNT(DISTINCT orderid) AS orders,
              COALESCE(SUM(total) FILTER (WHERE total IS NOT NULL), 0) AS revenue
       FROM order_history
       WHERE time::date BETWEEN $1::date AND $2::date
       GROUP BY pay_type
       ORDER BY revenue DESC`,
      [start, end]
    );
    res.json(result.rows.map(r => ({
      payType: r.pay_type,
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
    })));
  } catch (err) {
    console.error('Payment methods failure:', err);
    res.status(500).json({ error: 'Failed to generate payment methods report' });
  }
});

// GET API: Employee/server performance report
app.get('/api/reports/employee-performance', async (req, res) => {
  const { start, end } = reportDateRange(req);
  try {
    const result = await pool.query(
      `SELECT server,
              COUNT(DISTINCT orderid) AS orders,
              COALESCE(SUM(total) FILTER (WHERE total IS NOT NULL), 0) AS revenue
       FROM order_history
       WHERE time::date BETWEEN $1::date AND $2::date
       GROUP BY server
       ORDER BY revenue DESC`,
      [start, end]
    );
    res.json(result.rows.map(r => ({
      server: r.server,
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
    })));
  } catch (err) {
    console.error('Employee performance failure:', err);
    res.status(500).json({ error: 'Failed to generate employee performance report' });
  }
});

// GET API: Inventory report
app.get('/api/reports/inventory', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY supply_qty ASC, supply_name ASC');
    res.json(result.rows.map(r => ({
      supplyId: r.supply_id,
      name: r.supply_name,
      qty: Number(r.supply_qty) || 0,
      units: r.supply_order_units,
      cost: Number(r.supply_cost) || 0,
      changeType: r.change_type,
      recordedAt: r.recorded_at,
    })));
  } catch (err) {
    console.error('Inventory report failure:', err);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

// Fallback static resource router pipeline layer
app.use(express.static(buildDirectory));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(buildDirectory, "index.html"));
});

(async () => {
  try {
    await pool.query("SELECT setval('menu_itemid_seq', (SELECT COALESCE(MAX(itemid),0) FROM menu))");
  } catch (err) {
    console.error('Sequence sync warning:', err.message);
  }
  app.listen(port, () => {
    console.log(`Pearl Garden backend server is listening on port ${port}`);
  });
})();
