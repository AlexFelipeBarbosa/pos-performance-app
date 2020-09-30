const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;

process.env.APP_NAME = "index-A";
const newrelic = require("newrelic");

app.use(express.json());

function getRandom(min = 0, max = 1) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get("/", (req, res) => {
  console.log("Sucesso!!!!");
  res.send("OK");
});

app.get("/error", (req, res) => {
  res.status(500).send("Ocorreu um erro na API!");
});

app.listen(port, () => {
  console.log(`Aplicação A rodando na url -- ${url}`);
});
