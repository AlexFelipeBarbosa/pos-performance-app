const express = require("express");
const requestPromise = require("request-promise");
const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;

app.use(express.json());

async function requestApi(retryCount = 0, maxRetryCount = 1) {
  const urlApi = "http://localhost:3000/";
  retryCount++;

  try {
    return requestPromise(urlApi);
  } catch (err) {
    if (retryCount <= maxRetryCount) {
      return await requestApi(retryCount, maxRetryCount);
    } else {
      throw err;
    }
  }
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
