const express = require("express");
const { getOrders, getOrderById, createOrder, deleteOrder } = require("../controllers/ordersController");
const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);

router.post("/", createOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
