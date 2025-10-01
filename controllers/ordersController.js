const Order = require("../models/Orders");
const OrderProduct = require("../models/OrderProduct");
const User = require("../models/Users");
const db = require("../config/db");

/*exports.getOrders = (req, res) => {
  Order.getAll((err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
}; */

exports.getOrders = (req, res) => {
  const sql = `
    SELECT 
      o.id, 
      o.order_number, 
      o.customer_name, 
      o.total, 
      o.profit,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', op.name,
            'quantity', op.quantity,
            'selling_price', op.selling_price,
            'buying_price', op.buying_price
          )
        ), '[]'
      ) AS products
    FROM orders o
    LEFT JOIN order_products op ON o.id = op.order_id
    GROUP BY o.id
    ORDER BY o.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).send(err);
    }

    // Parse JSON string into array
    results.forEach(order => {
      try {
        order.products = JSON.parse(order.products);
      } catch {
        order.products = [];
      }
    });

    res.json(results);
  });
};

exports.getOrderById = (req, res) => {
  const orderId = req.params.id;
  Order.getById(orderId, (err, order) => {
    if (err) return res.status(500).send(err);
    if (!order) return res.status(404).send("Order not found");

    OrderProduct.getByOrderId(orderId, (err2, products) => {
      if (err2) return res.status(500).send(err2);
      res.json({ ...order, products });
    });
  });
};

exports.createOrder = (req, res) => {
  const { firebase_uid, order_number, customer_name, total, profit, products } = req.body;

  if (!firebase_uid) {
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  // find user_id by firebase_uid
  User.findbyUid(firebase_uid, (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error while finding user" });
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const user_id = rows[0].id;

    // start transaction
    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: "Failed to start transaction" });

      // create order
      Order.create({ user_id, order_number, customer_name, total, profit }, (err2, orderId) => {
        if (err2) {
          return db.rollback(() => {
            res.status(500).json({ error: err2.message || "Failed to create order." });
          });
        }

        // insert products
        OrderProduct.bulkInsert(orderId, products, (err3) => {
          if (err3) {
            return db.rollback(() => {
              res.status(400).json({ error: err3.message || "Failed to insert products." });
            });
          }

          // commit transaction
          db.commit((err4) => {
            if (err4) {
              return db.rollback(() => {
                res.status(500).json({ error: "Failed to commit transaction" });
              });
            }

            res.json({ success: true, orderId });
          });
        });
      });
    });
  });
};


exports.deleteOrder = (req, res) => {
  const orderId = req.params.id;

  OrderProduct.deleteByOrderId(orderId, (err) => {
    if (err) return res.status(500).send(err);

    Order.delete(orderId, (err2) => {
      if (err2) return res.status(500).send(err2);
      res.json({ success: true });
    });
  });
};
