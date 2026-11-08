import pkg from 'pg';
const {Pool}=pkg;
const pool=new Pool({host:'csce-315-db.engr.tamu.edu',port:5432,database:'squad_12_db',user:'squad_12',password:'Boba26$$$$',ssl:{rejectUnauthorized:false}});
const run=async(q,params=[])=>pool.query(q,params);
await run("SELECT setval('menu_itemid_seq', (SELECT COALESCE(MAX(itemid),0) FROM menu))");
console.log("seq now:", (await run("SELECT last_value, is_called FROM menu_itemid_seq")).rows);
// clean any duplicate test rows
await run("DELETE FROM menu WHERE item_name='Test Drink'");
console.log("done");
await pool.end();
