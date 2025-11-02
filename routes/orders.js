const express = require("express");
//const { getOrders, getOrderById, createOrder, deleteOrder } = require("../controllers/ordersController");
const { getOrders, getOrderById, createOrder, deleteOrder, updateOrder } = require("../controllers/ordersController");

const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);

router.post("/", createOrder);
router.delete("/:id", deleteOrder);
router.put("/:id", updateOrder);

module.exports = router;



