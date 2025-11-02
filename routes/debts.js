const express = require("express");
//const {getDebt, createDebt, deleteDebt, addDebtProducts, updateStatus} = require("../controllers/debtsController");
const { getDebt, createDebt, deleteDebt, addDebtProducts, updateStatus, updateDebt } = require("../controllers/debtsController");


const router = express.Router();


router.get("/", getDebt);
router.post("/", createDebt);
router.delete("/:id", deleteDebt);
router.post("/:debtId/products", addDebtProducts);
router.put("/:id/status", updateStatus);
router.put("/:id", updateDebt);

module.exports = router;



