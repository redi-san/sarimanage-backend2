const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ordersRoutes = require("./routes/orders");
const stocksRoutes = require("./routes/stocks");
const usersRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/orders", ordersRoutes);
app.use("/stocks", stocksRoutes);
app.use("/users", usersRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
