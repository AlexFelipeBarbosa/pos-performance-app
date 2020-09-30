process.env.APP_NAME = "index-B";
const newrelic = require("newrelic");
const log = require("./log");

const express = require("express");
const got = require("got");
const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || "localhost";
const url = `http://${host}:${port}`;
const CircuitBreaker = require("opossum");
const redis = require("redis");
const util = require("util");

const circuitBreakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 10,
  resetTimeout: 10000,
};

const breaker = new CircuitBreaker(requestApi, circuitBreakerOptions);
breaker.on("open", () => console.log(`OPEN: The breaker`));
breaker.on("halfOpen", () => console.log(`HALF_OPEN: The breaker`));
breaker.on("close", () => console.log(`CLOSE: The breaker`));

const client = redis.createClient({ host: "127.0.0.1", port: 6379 });
const redisSetPromise = util.promisify(client.set).bind(client);
const redisGetPromise = util.promisify(client.get).bind(client);
const REDISCACHEKEY = "get-api";

async function requestFallbackRedis() {
  let response = "Ok! Faullback";
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

app.use((req, res, next) => {
  const { params, body, query, method, url, headers } = req;
  log.info({
    req: {
      method,
      url,
      headers: JSON.stringify(headers),
      params: JSON.stringify(params),
      query: JSON.stringify(query),
      body: JSON.stringify(body),
    },
  });
  next();
});

app.get("/cache", async (req, res) => {
  try {
    const response = await requestCB();
    res.send(response);
  } catch (err) {
    res.status(500).send("Erro na chamada da API A");
  }
});

app.listen(port, () => {
  console.log(`Aplicação B rodando na url -- ${url}`);
});
