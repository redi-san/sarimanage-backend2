const db = require("../config/db");

const Users = {
  create: (user, callback) => {
    const { firebase_uid, name, email } = user;

    const query = "INSERT INTO users (firebase_uid, name, email) VALUES (?, ?, ?)";
    db.query(query, [firebase_uid, name, email], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result.insertId);
    });
  },

  findbyUid: (uid, callback) => {
    const query = "SELECT * FROM users WHERE firebase_uid = ?";
    db.query(query, [uid], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  }
};

module.exports = Users;
