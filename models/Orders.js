const db = require("../config/db");
const { getById } = require("./Stocks");

const Order = {
  getAll: (callback) => {
    db.query("SELECT * FROM orders", callback);
  },

  getById: (id, callback) => {
    db.query("SELECT * FROM orders WHERE id = ?", [id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0]);
    });
  },

  create: (order, callback) => {
    const {user_id, order_number, customer_name, total, profit } = order;
    const query = "INSERT INTO orders (user_id, order_number, customer_name, total, profit) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [user_id, order_number, customer_name, total, profit], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result.insertId);
    });
  },

  delete: (id, callback) => {
    db.query("DELETE FROM orders WHERE id = ?", [id], callback);
  }
};

module.exports = Order;
