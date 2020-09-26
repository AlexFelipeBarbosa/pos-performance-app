const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;

app.use(express.json());

function getRandom(min = 0, max = 1) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get("/", (req, res) => {
  const value = getRandom();

  if (value === 1) {
    console.log("Sucesso");
    res.send("OK");
  } else {
    console.log("Erro na API A");
    res.status(500).send("Algum problema encontrado!");
  }

  res.send(url);
});

app.listen(port, () => {
  console.log(`Aplicação A rodando na url -- ${url}`);
});
