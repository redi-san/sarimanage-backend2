const Debt = require("../models/Debts");
const DebtProduct = require("../models/DebtProduct");
const User = require("../models/Users");
const db = require("../config/db");

exports.getDebt = (req, res) => {
  const sql = `
    SELECT 
      d.id, 
      d.customer_name,
      d.contact_number,
      d.date,
      d.due_date,
      d.note,
      d.status,
      d.total,
      d.profit,
      COALESCE(
  JSON_ARRAYAGG(
    JSON_OBJECT(
  'id', dp.id,
  'stock_id', dp.stock_id,
  'name', dp.name,
  'quantity', dp.quantity,
  'selling_price', dp.selling_price,
  'buying_price', dp.buying_price,
  'dateAdded', dp.date_added
)

  ), '[]'
) AS products

    FROM debts d
    LEFT JOIN debt_products dp ON d.id = dp.debt_id
    GROUP BY d.id
    ORDER BY d.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching debts:", err);
      return res.status(500).send(err);
    }

    results.forEach((debt) => {
      // Convert products from JSON string
      try {
        debt.products = JSON.parse(debt.products);
      } catch {
        debt.products = [];
      }

      // Format date and due_date to YYYY-MM-DD only
      if (debt.date)
        debt.date = new Date(debt.date).toLocaleDateString("en-CA");
      if (debt.due_date)
        debt.due_date = new Date(debt.due_date).toLocaleDateString("en-CA");
    });

    res.json(results);
  });
};

// CREATE a new debt with products
exports.createDebt = (req, res) => {
  const {
    user_id,
    customer_name,
    contact_number,
    date,
    due_date,
    note,
    status,
    total,
    profit,
    products,
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  const finalStatus = status && status.trim() !== "" ? status : "Unpaid";

  // find user_id by firebase_uid
  User.findbyUid(user_id, (err, rows) => {
    if (err)
      return res.status(500).json({ error: "DB error while finding user" });
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user_id = rows[0].id;

    db.beginTransaction((err) => {
      if (err)
        return res.status(500).json({ error: "Failed to start transaction" });

      // ✅ Create debt
      Debt.create(
        {
          user_id,
          customer_name,
          contact_number,
          date,
          due_date: due_date && due_date.trim() !== "" ? due_date : null, // ✅ allow null
          note,
          status: finalStatus,
          total,
          profit,
        },
        (err2, debtId) => {
          if (err2) {
            return db.rollback(() => {
              res
                .status(500)
                .json({ error: err2.message || "Failed to create debt." });
            });
          }

          // ✅ Insert products if any
          DebtProduct.bulkInsert(debtId, products, (err3) => {
            if (err3) {
              return db.rollback(() => {
                res.status(400).json({
                  error: err3.message || "Failed to insert products.",
                });
              });
            }

            // ✅ Commit transaction
            db.commit((err4) => {
              if (err4) {
                return db.rollback(() => {
                  res
                    .status(500)
                    .json({ error: "Failed to commit transaction" });
                });
              }
              res.json({ success: true, debtId });
            });
          });
        }
      );
    });
  });
};

exports.addDebtProducts = (req, res) => {
  const { debtId } = req.params;
  const { products, total, profit } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "No products provided" });
  }

  // Insert products to debt_products
  DebtProduct.bulkInsert(debtId, products, (err) => {
    if (err) {
      console.error("Error adding products:", err);
      return res.status(400).json({ error: err.message });
    }

    // Update totals in debts table
    const updateQuery = `
      UPDATE debts 
      SET total = total + ?, profit = profit + ? 
      WHERE id = ?
    `;
    db.query(updateQuery, [total, profit, debtId], (updateErr) => {
      if (updateErr) {
        console.error("Error updating totals:", updateErr);
        return res.status(500).json({ error: "Failed to update debt totals" });
      }

      res.json({ message: "Products successfully added to debt" });
    });
  });
};

(exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["partial", "paid"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  Debt.updateStatus(id, status, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Debt not found" });

    res.json({ message: `Debt marked as ${status}` });
  });
}),
  (exports.deleteDebt = (req, res) => {
    const debtId = req.params.id;

    // delete related products first
    DebtProduct.deleteByDebtId(debtId, (err) => {
      if (err) return res.status(500).send(err);

      Debt.delete(debtId, (err2) => {
        if (err2) return res.status(500).send(err2);
        res.json({ success: true });
      });
    });
  });

/*exports.updateDebt = (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    contact_number,
    date,
    due_date,
    note,
    status,
    total,
    profit,
    products,
  } = req.body;

  // Update debt info first
  const updateDebtQuery = `
    UPDATE debts
    SET customer_name = ?, contact_number = ?, date = ?, due_date = ?, note = ?, status = ?, total = ?, profit = ?
    WHERE id = ?
  `;

  db.query(
    updateDebtQuery,
    [
      customer_name,
      contact_number,
      date,
      due_date && due_date.trim() !== "" ? due_date : null, // ✅ convert '' → null
      note,
      status,
      total,
      profit,
      id,
    ],

    (err) => {
      if (err) {
        console.error("Error updating debt:", err);
        return res.status(500).json({ error: "Failed to update debt info" });
      }

      // Replace products (delete old and insert new)
      db.query(
        "DELETE FROM debt_products WHERE debt_id = ?",
        [id],
        (delErr) => {
          if (delErr) {
            console.error("Error deleting old products:", delErr);
            return res
              .status(500)
              .json({ error: "Failed to reset old products" });
          }

          if (!products || products.length === 0) {
            return res.json({
              message: "Debt updated successfully (no products)",
            });
          }

          const insertValues = products.map((p) => [
            id,
            p.stock_id || null,
            p.name,
            p.quantity,
            p.selling_price,
            p.buying_price,
            p.dateAdded || new Date().toISOString().split("T")[0],
          ]);

          const insertQuery = `
  INSERT INTO debt_products (debt_id, stock_id, name, quantity, selling_price, buying_price, date_added)
  VALUES ?
`; 

          db.query(insertQuery, [insertValues], (insertErr) => {
            if (insertErr) {
              console.error("❌ SQL Insert failed:", insertErr.sqlMessage);
              console.error("❌ Data sent:", insertValues);
              return res.status(500).json({
                error:
                  insertErr.sqlMessage || "Failed to insert updated products",
              });
            }

            res.json({ message: "✅ Debt and products updated successfully" });
          });
        }
      );
    }
  );
}; */

exports.updateDebt = (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    contact_number,
    date,
    due_date,
    note,
    status,
    total,
    profit,
    products,
  } = req.body;

  const updateDebtQuery = `
    UPDATE debts
    SET customer_name = ?, contact_number = ?, date = ?, due_date = ?, note = ?, status = ?, total = ?, profit = ?
    WHERE id = ?
  `;

  db.query(
    updateDebtQuery,
    [
      customer_name,
      contact_number,
      date,
      due_date && due_date.trim() !== "" ? due_date : null,
      note,
      status,
      total,
      profit,
      id,
    ],
    (err) => {
      if (err) {
        console.error("Error updating debt:", err);
        return res.status(500).json({ error: "Failed to update debt info" });
      }

      // ✅ Step 1: Fetch old products to restore stock
      db.query(
        "SELECT stock_id, quantity FROM debt_products WHERE debt_id = ?",
        [id],
        (selErr, oldProducts) => {
          if (selErr) {
            console.error("Error fetching old products:", selErr);
            return res
              .status(500)
              .json({ error: "Failed to fetch old products" });
          }

          // Restore stock from old products
          const restoreTasks = oldProducts
            .filter((p) => p.stock_id)
            .map(
              (p) =>
                new Promise((resolve, reject) => {
                  db.query(
                    "UPDATE stocks SET stock = stock + ? WHERE id = ?",
                    [p.quantity, p.stock_id],
                    (err2) => (err2 ? reject(err2) : resolve())
                  );
                })
            );

          Promise.all(restoreTasks)
            .then(() => {
              // ✅ Step 2: Delete old debt_products
              db.query(
                "DELETE FROM debt_products WHERE debt_id = ?",
                [id],
                (delErr) => {
                  if (delErr) {
                    console.error("Error deleting old products:", delErr);
                    return res.status(500).json({
                      error: "Failed to reset old products",
                    });
                  }

                  if (!products || products.length === 0) {
                    return res.json({
                      message: "Debt updated successfully (no products)",
                    });
                  }

                  // ✅ Step 3: Insert new products
                  const insertValues = products.map((p) => [
                    id,
                    p.stock_id || null,
                    p.name,
                    p.quantity,
                    p.selling_price,
                    p.buying_price,
                    p.dateAdded ||
                      new Date().toLocaleDateString("en-CA"),
                  ]);

                  const insertQuery = `
                    INSERT INTO debt_products 
                    (debt_id, stock_id, name, quantity, selling_price, buying_price, date_added)
                    VALUES ?
                  `;

                  db.query(insertQuery, [insertValues], (insertErr) => {
                    if (insertErr) {
                      console.error("❌ SQL Insert failed:", insertErr);
                      return res.status(500).json({
                        error:
                          insertErr.sqlMessage ||
                          "Failed to insert updated products",
                      });
                    }

                    // ✅ Step 4: Deduct stock for new products
                    const deductTasks = products
                      .filter((p) => p.stock_id)
                      .map(
                        (p) =>
                          new Promise((resolve, reject) => {
                            db.query(
                              "UPDATE stocks SET stock = stock - ? WHERE id = ?",
                              [p.quantity, p.stock_id],
                              (err3) => (err3 ? reject(err3) : resolve())
                            );
                          })
                      );

                    Promise.all(deductTasks)
                      .then(() => {
                        res.json({
                          message:
                            "✅ Debt and stock levels updated successfully",
                        });
                      })
                      .catch((err3) => {
                        console.error("Error deducting stock:", err3);
                        res.status(500).json({
                          error: "Failed to adjust stock levels",
                        });
                      });
                  });
                }
              );
            })
            .catch((restoreErr) => {
              console.error("Error restoring old stock:", restoreErr);
              res
                .status(500)
                .json({ error: "Failed to restore stock levels" });
            });
        }
      );
    }
  );
};

