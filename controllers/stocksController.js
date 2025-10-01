const Stock = require("../models/Stocks");
const User = require("../models/Users");

exports.getStocks = (req, res) => {
  Stock.getAll((err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.getStockById = (req, res) => {
  Stock.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Stock not found");
    res.json(results[0]);
  });
};

exports.createStock = (req, res) => {
  const { firebase_uid, id, name, category, stock: qty, lowstock, buying_price, selling_price, notes, image } = req.body;

  if (!firebase_uid) {
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  if (!name || !category || qty == null || buying_price == null ||selling_price == null) {
    return res.status(400).json({ error: "Missing required stock fields" });
  }

  // Find user_id by firebase_uid
  User.findbyUid(firebase_uid, (err, rows) => {
    if (err) {
      console.error("DB error finding user:", err);
      return res.status(500).json({ error: "Database error while finding user" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user_id = rows[0].id;

    // Create the stock
    Stock.create({ id, user_id, name, category, stock: qty, lowstock, buying_price, selling_price, notes, image }, (err2, stockId) => {
      if (err2) {
        console.error("DB error creating stock:", err2);
        return res.status(500).json({ error: err2.message || "Failed to create stock" });
      }

      res.json({ success: true, stockId });
    });
  });
};

exports.updateStock = (req, res) => {
  Stock.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
};

exports.deleteStock = (req, res) => {
  Stock.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
};
