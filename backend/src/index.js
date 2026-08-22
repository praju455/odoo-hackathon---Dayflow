const express = require("express");
require("dotenv").config();

const setupRoutes = require("./routes/setup");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/setup", setupRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(port, () => {
  console.log(`Dayflow backend listening on port ${port}`);
});
