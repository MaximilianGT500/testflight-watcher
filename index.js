const fs = require("fs");
const { execSync } = require("child_process");
require("dotenv").config();
const axios = require("axios");
const PushoverAPI = require("./PushoverAPI");
const cheerio = require("cheerio");
const clc = require("cli-color");
const crypto = require("crypto");
const path = require("path");
const express = require("express");

const CURRENT_VERSION = "0.0.2";
const UPDATE_CHECK_URL =
  "https://git.lunoxia.net/MaximilianGT500/testflight-watcher/raw/branch/main/version.json";
const SETUP_FILE_NAME = process.env.SETUP_FILE_NAME || "setup.js";
const SERVER_FILE_NAME = process.env.SERVER_FILE_NAME || "index.js";
const USER_AGENT =
  process.env.USER_AGENT || "Testflight-Watcher/0.0.2 (Monitoring Script)";
const OTP_SECRET = process.env.OTP_SECRET || "AendereDiesenString";
const OTP_VALIDITY = process.env.OTP_VALIDITY || "5 * 60 * 1000";
const PORT = process.env.PORT || "3000";
const HTTP_URL = process.env.HTTP_URL || `http://localhost:${PORT}`;
const PUSHOVER_PRIORITY = process.env.PUSHOVER_PRIORITY || `1`;
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || `30`;
let TESTFLIGHT_URLS = [];
let OTP_STORAGE = {};

function loadConfig() {
  if (!fs.existsSync(".env")) {
    console.log(
      clc.yellowBright("⚠️ Konfigurationsdatei `.env` fehlt. Starte Setup...")
    );
    execSync(`node ${SETUP_FILE_NAME}`, { stdio: "inherit" });
    require("dotenv").config();
  }

  const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
  const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN;
  TESTFLIGHT_URLS = process.env.TESTFLIGHT_URLS
    ? JSON.parse(process.env.TESTFLIGHT_URLS)
    : [];

  if (!PUSHOVER_USER_KEY || !PUSHOVER_APP_TOKEN) {
    console.error(
      clc.redBright(
        `❌ Fehlende Konfiguration. Bitte führe das Setup erneut aus: "node ${SETUP_FILE_NAME}".`
      )
    );
    execSync(`node ${SETUP_FILE_NAME}`, { stdio: "inherit" });
    require("dotenv").config();
    process.exit(1);
  }

  if (!Array.isArray(TESTFLIGHT_URLS) || TESTFLIGHT_URLS.length === 0) {
    console.error(
      clc.redBright(
        "❌ Keine gültigen TestFlight-URLs in der Konfiguration gefunden. Bitte führe das Setup erneut aus."
      )
    );
    execSync(`node ${SETUP_FILE_NAME}`, { stdio: "inherit" });
    process.exit(1);
  }

  return { PUSHOVER_USER_KEY, PUSHOVER_APP_TOKEN };
}

async function checkForUpdates() {
  try {
    console.clear();
    console.log(clc.cyan("🔄 Prüfe auf Updates..."));
    const { data } = await axios.get(UPDATE_CHECK_URL);
    const latestVersion = data.version;

    if (latestVersion !== CURRENT_VERSION) {
      console.log(
        clc.yellowBright(
          `🚨 Neue Version verfügbar: ${latestVersion}. Bitte aktualisiere das Skript.\n`
        )
      );
    } else {
      console.log(clc.green("✅ Skript ist auf dem neuesten Stand.\n"));
    }
  } catch (error) {
    console.error(
      clc.redBright("❌ Fehler beim Prüfen auf Updates:", error.message)
    );
  }
}

function updateTestFlightURLs(newURLs) {
  const envPath = path.resolve(__dirname, ".env");
  let envFile = fs.readFileSync(envPath, "utf8");

  const testflightUrlsRegex = /TESTFLIGHT_URLS=[^\n]*/;
  const newTestFlightUrls = `TESTFLIGHT_URLS=${JSON.stringify(newURLs)}`;

  if (testflightUrlsRegex.test(envFile)) {
    envFile = envFile.replace(testflightUrlsRegex, newTestFlightUrls);
  } else {
    envFile += `\n${newTestFlightUrls}`;
  }

  fs.writeFileSync(envPath, envFile, "utf8");
  console.log(
    clc.green(
      "✅ .env-Datei erfolgreich mit neuen TESTFLIGHT_URLS aktualisiert."
    )
  );
}

async function checkAllTestFlights(TESTFLIGHT_URLS, pushoverAPI) {
  console.clear();
  const now = new Date().toLocaleTimeString();
  console.log(clc.blue(`⏰ Letzte Prüfung: ${now}\n`));

  const results = await Promise.all(
    TESTFLIGHT_URLS.map((app) => checkTestFlight(app, pushoverAPI))
  );
  results.forEach((result) => console.log(result));

  console.log(
    clc.blue(
      `\n✔️ Letzte Prüfung abgeschlossen: ${now}` +
        clc.red`\n\nDrücke STRG+C zum Beenden.`
    )
  );
}

async function checkTestFlight(app, pushoverAPI) {
  try {
    const { data } = await axios.get(app.url, {
      headers: {
        Accept: "text/html",
        "User-Agent": USER_AGENT,
      },
    });

    const $ = cheerio.load(data);
    const betaStatus = $("div.beta-status span").text().trim();

    if (betaStatus === "This beta is full.") {
      return clc.red(`❌ ${app.name}: Beta-Test ist voll.`);
    } else if (
      betaStatus === "This beta isn't accepting any new testers right now."
    ) {
      return clc.red(`❌ ${app.name}: Beta akzeptiert keine neuen Tester.`);
    } else {
      const otp = generateOTP(app.url);
      OTP_STORAGE[app.url] = otp;
      await sendPushoverNotification(
        pushoverAPI,
        `🎉 TestFlight Beta verfügbar für ${app.name}!`,
        `Der Beta-Test für ${app.name} ist verfügbar. Jetzt anmelden! 🚀\n\n${app.url}\n\nRufe diesen Link auf, um die TestFlight-Beta-URL zu löschen: ${HTTP_URL}/delete?otp=${otp}&url=${app.url}`
      );
      return clc.green(
        `✅ ${app.name}: Beta-Test ist verfügbar! Benachrichtigung gesendet. (Status: ${betaStatus})`
      );
    }
  } catch (error) {
    return clc.redBright(
      `❌ Fehler beim Abrufen der Seite für ${app.name}: ${error.message}`
    );
  }
}

async function sendPushoverNotification(pushoverAPI, title, message) {
  const options = {
    priority: PUSHOVER_PRIORITY,
    sound: "pushover",
  };

  const response = await pushoverAPI.sendNotification(title, message, options);
  if (!response) {
    console.error(clc.redBright("❌ Fehler beim Senden der Benachrichtigung."));
  }
}

function generateOTP(url) {
  const timeWindow = Math.floor(Date.now() / OTP_VALIDITY);
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${timeWindow}-${url}`)
    .digest("hex")
    .slice(0, 6);
}

function verifyOTP(otp, url) {
  const timeWindow = Math.floor(Date.now() / OTP_VALIDITY);
  const validOTP = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${timeWindow}-${url}`)
    .digest("hex")
    .slice(0, 6);

  if (otp === validOTP && OTP_STORAGE[url] === otp) {
    delete OTP_STORAGE[url];
    return true;
  }
  return false;
}

function startServer(TESTFLIGHT_URLS) {
  const app = express();
  app.use(express.static("public"));

  app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testflight Watcher | Startseite</title>
    <link rel="stylesheet" type="text/css" href="/assets/css/homepage.css" media="all">
</head>
<body>
    <div class="container">
        <div class="title">Testfligt-Watcher</div>
        <div class="message">Diese Anwendung überwacht TestFlight-URLs und sendet Benachrichtigungen, wenn Plätze verfügbar sind.</div>
    </div>
</body>
</html>`);
  });

  app.get("/delete", (req, res) => {
    const otp = req.query.otp;
    const urlToDelete = req.query.url;

    if (!verifyOTP(otp, urlToDelete)) {
      return res.status(403).send(
        `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testflight Watcher | Fehler - Ungültiger Token</title>
    <link rel="stylesheet" type="text/css" href="/assets/css/error.css" media="all">
</head>
<body>
    <div class="error-container">
        <svg class="crossmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="crossmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path class="crossmark__cross" fill="none" d="M16 16l20 20M36 16l-20 20" />
        </svg>
        <div class="error-title">Ungültig</div>
        <div class="error-message">Das OTP ist <b>ungültig</b>.</br>Bitte überprüfe Deine Eingaben.</div>
    </div>
</body>
</html>`
      );
    }

    TESTFLIGHT_URLS = TESTFLIGHT_URLS.filter((app) => app.url !== urlToDelete);

    updateTestFlightURLs(TESTFLIGHT_URLS);

    res.send(
      `<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testflight Watcher | Erfolgreich - ${urlToDelete} gelöscht</title>
    <link rel="stylesheet" type="text/css" href="/assets/css/success.css" media="all">
</head>

<body>
    <div class="success-container">
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
        <div class="success-title">Erfolgreich</div>
        <div class="success-message">TestFlight-URL für ${urlToDelete} wurde <b>erfolgreich</b> gelöscht</div>
    </div>
</body>

</html>`
    );
    execSync(`pm2 restart ${SERVER_FILE_NAME}`);
  });

  app.listen(PORT, () => {
    console.log(
      clc.green("🔧 Express-Server läuft.") +
        clc.red("\n\nDrücke STRG+C zum Beenden.")
    );
  });
}

(async () => {
  const { PUSHOVER_USER_KEY, PUSHOVER_APP_TOKEN } = loadConfig();
  const pushoverAPI = new PushoverAPI(PUSHOVER_USER_KEY, PUSHOVER_APP_TOKEN);

  await checkForUpdates();
  console.log(clc.green("🔧 TestFlight-Monitor gestartet."));

  startServer(TESTFLIGHT_URLS);

  setInterval(
    () => checkAllTestFlights(TESTFLIGHT_URLS, pushoverAPI),
    CHECK_INTERVAL * 1000
  );
})();
