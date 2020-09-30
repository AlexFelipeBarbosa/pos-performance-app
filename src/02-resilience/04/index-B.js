const express = require("express");
const app = express();
const got = require("got");
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;
const CircuitBreaker = require("opossum");
const redis = require("redis");
const util = require("util");
const client = redis.createClient({ host: "127.0.0.1", port: 6379 });
const redisSetPromise = util.promisify(client.set).bind(client);
const redisGetPromise = util.promisify(client.get).bind(client);
const REDISCACHEKEY = "get-api";

const circuitBreakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 10,
  resetTimeout: 10000,
};

const breaker = new CircuitBreaker(requestApi, circuitBreakerOptions);
breaker.on("open", () => console.log(`OPEN: The breaker`));
breaker.on("halfOpen", () => console.log(`HALF_OPEN: The breaker`));
breaker.on("close", () => console.log(`CLOSE: The breaker`));

async function requestFallbackRedis() {
  let response = "Ok! Default";
  try {
    const responseRedis = await redisGetPromise(REDISCACHEKEY);
    if (responseRedis) {
      response = JSON.parse(responseRedis);
    }
  } catch (err) {
    console.error("Erro ao consultar cache no Redis");
  }

  return response;
}

breaker.fallback(requestFallbackRedis);

app.use(express.json());

async function requestApi(maxRetryCount = 0) {
  const urlApi = "http://localhost:3000/";
  const { body } = await got(urlApi, { retry: maxRetryCount });

  try {
    await redisSetPromise(REDISCACHEKEY, JSON.stringify(body));
  } catch (err) {
    console.log("Erro ao salvar as informações no cache do REDIS");
  }
  return body;
}

async function requestCB() {
  return breaker.fire();
}

app.get("/cache", async (req, res) => {
  try {
    const response = await requestCB();
    res.send("Ok!");
  } catch (err) {
    res.status(500).send("Erro na chamada da API A");
  }
});

app.listen(port, () => {
  console.log(`Aplicação B rodando na url -- ${url}`);
});
