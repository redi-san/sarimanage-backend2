const express = require("express");
const { getStocks, getStockById, createStock, updateStock, deleteStock } = require("../controllers/stocksController");
const router = express.Router();

router.get("/", getStocks);
router.get("/:id", getStockById);
router.post("/", createStock);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

module.exports = router;