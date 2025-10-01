const mysql = require("mysql2");

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

module.exports = db;
