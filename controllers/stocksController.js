const Stock = require("../models/Stocks");
const User = require("../models/Users");

exports.getStocks = (req, res) => {
  Stock.getAll((err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.getStockBylowstock = (req, res) => {
  Stock.getBylowstock((err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Stock not found");
    res.json(results);
  });
};

exports.createStock = (req, res) => {
  const { firebase_uid, id, barcode, name, category, stock: qty, lowstock, buying_price, selling_price, notes } = req.body;

  if (!firebase_uid) {
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  if (!name || !category || qty == null || buying_price == null || selling_price == null) {
    return res.status(400).json({ error: "Missing required stock fields" });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  User.findbyUid(firebase_uid, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error while finding user" });
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const user_id = rows[0].id;

    Stock.create(
      { id, user_id, barcode, name, category, stock: qty, lowstock, buying_price, selling_price, notes, image: imagePath },
      (err2, stockId) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Return full stock object
        res.json({
          id: stockId,
          user_id,
          barcode,
          name,
          category,
          stock: qty,
          lowstock,
          buying_price,
          selling_price,
          notes,
          image: imagePath,
        });
      }
    );
  });
};


/*exports.updateStock = (req, res) => {
  Stock.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
};*/

exports.updateStock = (req, res) => {
  const updatedData = req.body;

  // If a new image is uploaded, add it to the update
  if (req.file) {
    updatedData.image = `/uploads/${req.file.filename}`;
  }

  Stock.update(req.params.id, updatedData, (err) => {
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
