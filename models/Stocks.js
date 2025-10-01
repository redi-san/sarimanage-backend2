const db = require("../config/db");

const Stock = {
  getAll: (callback) => {
    db.query("SELECT * FROM stocks", callback);
  },

  getById: (id, callback) => {
    db.query("SELECT * FROM stocks WHERE name = ?", [id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0]);
    });
  },

  create: (stock, callback) => {
    const { id, user_id, name, category, stock: qty, lowstock, buying_price, selling_price, notes, image } = stock;
    const query = `
      INSERT INTO stocks 
      (id, user_id, name, category, stock, lowstock, buying_price, selling_price, notes, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [id, user_id, name, category, qty, lowstock, buying_price, selling_price, notes, image], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result.insertId);
    });
  },

  update: (id, stock, callback) => {
    const { name, category, stock: qty, lowstock, buying_price, selling_price, notes, image } = stock;
    const query = `
      UPDATE stocks 
      SET name=?, category=?, stock=?, lowstock=?, buying_price=?, selling_price=?, notes=?, image=? 
      WHERE id=?
    `;
    db.query(query, [name, category, qty, lowstock, buying_price, selling_price, notes, image, id], callback);
  },

  delete: (id, callback) => {
    db.query("DELETE FROM stocks WHERE id = ?", [id], callback);
  }
};

module.exports = Stock;
