const express = require("express");
const got = require("got");
const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;

app.use(express.json());

async function requestApi(maxRetryCount = 1) {
  const urlApi = "http://localhost:3000/";
  return got(urlApi, { retry: maxRetryCount });
}

app.get("/retry", async (req, res) => {
  try {
    await requestApi();
    res.send("Ok!");
  } catch (err) {
    res.status(500).send("Erro na chamada da API A");
  }
});

app.listen(port, () => {
  console.log(`Aplicação B rodando na url -- ${url}`);
});
