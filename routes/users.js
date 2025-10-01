const express = require("express");
const { registerUser, getUser } = require("../controllers/usersController");
const router = express.Router();

router.post("/", registerUser);  
router.get("/:uid", getUser);     

module.exports = router;
