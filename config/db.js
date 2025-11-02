/*const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  //user: "Sarimanage", 
  user: "root",
  //password: "S@riman@ge1234", 
  password: "password",
  database: "sari_manage"

});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL Database");
});

module.exports = db;*/


const mysql = require("mysql2");

// Use environment variables for host, user, password, and database
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "sari_manage"
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL Database");
});

module.exports = db;
