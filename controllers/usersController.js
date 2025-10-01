const User = require("../models/Users"); 

exports.registerUser = (req, res) => {
  const { firebase_uid, name, email} = req.body;

  if (!firebase_uid || !email) {
    return res.status(400).json({ error: "Firebase UID and email required" });
  }

  User.create({ firebase_uid, name, email }, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "User already exists" });
      }
      return res.status(500).json({ error: "Failed to register user" });
    }
    res.json({ message: "User registered", userId: result });
  });
};

exports.getUser = (req, res) => {
  const { uid } = req.params;

  User.findbyUid(uid, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch user" });
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  });
};
