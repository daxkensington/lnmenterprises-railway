const express = require("express");
const path = require("path");

const app = express();
const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");
const port = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use(
  express.static(publicDir, {
    extensions: ["html"],
    maxAge: "7d",
  }),
);

app.get(/^\/(admin|api)(\/|$)/, (_req, res) => {
  res.status(404).send("Not found");
});

app.get("/files", (_req, res) => {
  res.redirect(301, "/");
});

app.get("*", (_req, res) => {
  res.sendFile(indexFile);
});

app.listen(port, () => {
  console.log(`L&M Enterprises Railway server listening on ${port}`);
});
