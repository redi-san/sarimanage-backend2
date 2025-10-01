const db = require("../config/db");

const OrderProduct = {
  getByOrderId: (orderId, callback) => {
    db.query("SELECT * FROM order_products WHERE order_id = ?", [orderId], callback);
  },

  bulkInsert: (orderId, products, callback) => {
    if (!products || products.length === 0) return callback(null);

    let i = 0;

    // Check stock sequentially
    function checkStock() {
      if (i >= products.length) {
        // All products have enough stock, proceed to insert
        return insertOrder();
      }

      const product = products[i];
      db.query("SELECT id, stock FROM stocks WHERE name = ?", [product.name], (err, rows) => {
        if (err) return callback(err);

        if (!rows.length) {
          return callback(new Error(`Product not found: ${product.name}`));
        }

        const stockRow = rows[0];

        if (stockRow.stock < product.quantity) {
          return callback(new Error(`Not enough stock for ${product.name}`));
        }

        
        product.stock_id = stockRow.id;

        // Continue checking next product
        i++;
        checkStock();
      });

    }

    // Insert order
    function insertOrder() {
      const insertQuery = `
      INSERT INTO order_products (order_id, stock_id, name, quantity, selling_price, buying_price) 
      VALUES ?
    `;
      const insertValues = products.map(p => [
        orderId,
        p.stock_id,   
        p.name,
        p.quantity,
        p.selling_price,
        p.buying_price
      ]);

      db.query(insertQuery, [insertValues], (err, res) => {
        if (err) return callback(err);

        // decrease stock sequentially
        let j = 0;
        function updateStock() {
          if (j >= products.length) {
            return callback(null, res);
          }

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

    // checking stock
    checkStock();
  },


  deleteByOrderId: (orderId, callback) => {
    db.query("DELETE FROM order_products WHERE order_id = ?", [orderId], callback);
  }
};

module.exports = OrderProduct;
