const db = require("../config/db");

const DebtProduct = {
  getByDebtId: (debtId, callback) => {
    db.query("SELECT * FROM debt_products WHERE debt_id = ?", [debtId], callback);
  },

  bulkInsert: (debtId, products, callback) => {
    if (!products || products.length === 0) return callback(null);

    let i = 0;

    function checkStock() {
      if (i >= products.length) return insertOrder();

      const product = products[i];
      db.query("SELECT id, stock FROM stocks WHERE name = ?", [product.name], (err, rows) => {
        if (err) return callback(err);
        if (!rows.length) return callback(new Error(`Product not found: ${product.name}`));

        const stockRow = rows[0];
        if (stockRow.stock < product.quantity)
          return callback(new Error(`Not enough stock for ${product.name}`));

        product.stock_id = stockRow.id;
        i++;
        checkStock();
      });
    }

    function insertOrder() {
      // ✅ Validate selling_price and buying_price
      const invalid = products.find(
        p => p.selling_price == null || p.buying_price == null
      );
      if (invalid) {
        return callback(new Error(`Missing price for product: ${invalid.name}`));
      }

      /*const insertQuery = `
        INSERT INTO debt_products (debt_id, stock_id, name, quantity, selling_price, buying_price)
        VALUES ?
      `;

      const insertValues = products.map(p => [
        debtId,
        p.stock_id,
        p.name,
        p.quantity,
        p.selling_price,
        p.buying_price
      ]);*/ 

      const insertQuery = `
  INSERT INTO debt_products (debt_id, stock_id, name, quantity, selling_price, buying_price, date_added)
  VALUES ?
`;

const insertValues = products.map(p => [
  debtId,
  p.stock_id,
  p.name,
  p.quantity,
  p.selling_price,
  p.buying_price,
  //p.dateAdded || new Date().toISOString().split("T")[0]
  p.dateAdded || new Date().toLocaleDateString("en-CA")


]);


      db.query(insertQuery, [insertValues], (err, res) => {
        if (err) return callback(err);

        let j = 0;
        function updateStock() {
          if (j >= products.length) return callback(null, res);

          const p = products[j];
          db.query(
            "UPDATE stocks SET stock = stock - ? WHERE name = ?",
            [p.quantity, p.name],
            (err2) => {
              if (err2) return callback(err2);
              j++;
              updateStock();
            }
          );
        }

        updateStock();
      });
    }

    checkStock();
  },

  deleteByDebtId: (debtId, callback) => {
    db.query("DELETE FROM debt_products WHERE debt_id = ?", [debtId], callback);
  }
};

module.exports = DebtProduct;
