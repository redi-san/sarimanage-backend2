const db = require("../config/db");
const { getById } = require("./Stocks");

const Debt = {
  getAll: (callback) => {
    db.query("SELECT * FROM debts", callback);
  },


  getById: (id, callback) => {
    db.query("SELECT * FROM debts WHERE id = ?", [id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0]);
    });
  },

  create: (debt, callback) => {
    const { user_id, customer_name, contact_number, date, due_date, note, status, total, profit } = debt;
    const query = "INSERT INTO debts (user_id, customer_name, contact_number, date, due_date, note, status, total, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [user_id, customer_name, contact_number, date, due_date, note, status, total, profit], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result.insertId);
    });
  },

  updateStatus: (id, status, callback) => {
    db.query(
      "UPDATE debts SET status = ? WHERE id = ?",
      [status, id],
      (err, result) => {
        if (err) return callback(err);
        callback(null, result);
      }
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM debts WHERE id = ?", [id], callback);
  },
};
module.exports = Debt;
