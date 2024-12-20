const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const PushoverAPI = require("./PushoverAPI");
const clc = require("cli-color");
require("dotenv").config();

const ENV_FILE = ".env";
const TESTFLIGHT_BASE_URL = "https://testflight.apple.com/join/";

function loadEnv() {
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    return Object.fromEntries(
      content
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=").map((part) => part.trim()))
    );
  }
  return {};
}

function saveEnv(env) {
  const content = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(ENV_FILE, content);
}

function saveURLs(urls) {
  const env = loadEnv();
  env.TESTFLIGHT_URLS = JSON.stringify(urls);
  saveEnv(env);
}

function loadURLs() {
  const env = loadEnv();
  return env.TESTFLIGHT_URLS ? JSON.parse(env.TESTFLIGHT_URLS) : [];
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function verifyURL(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    if (response.status === 200) {
      console.log(
        clc.greenBright("\n✅ Die URL ist gültig und die Beta existiert.")
      );
      return true;
    }
  } catch (error) {
    const errorMessage =
      error.response && error.response.status === 404
        ? "\n❌ Fehler: Die Beta existiert nicht (404)."
        : "❌ Fehler: Konnte die Seite nicht überprüfen. Netzwerkproblem?";
    console.log(clc.redBright(errorMessage));
  }
  return false;
}

function displayMessage(message, type = "info") {
  const color =
    type === "success"
      ? clc.green
      : type === "error"
      ? clc.red
      : clc.magentaBright;
  console.log(color(message));
}

async function manageURLs(userKey, appToken) {
  let urls = loadURLs();

  while (true) {
    clearConsole();
    displayMessage("📜 Aktuelle TestFlight-URLs:", "info");
    urls.forEach((app, index) => {
      console.log(clc.yellow(`${index + 1}. ${app.name} - ${app.url}`));
    });

    console.log("\n🛠️ Optionen:");
    console.log("1. 🆕 Neue URL hinzufügen");
    console.log("2. 🗑️ Existierende URL löschen");
    console.log("3. ✅ Fertig");

    const choice = await prompt(clc.cyan("Wähle eine Option (1/2/3): "));

    if (choice === "1") {
      const name = await prompt(clc.cyan("\nApp-Name: "));
      let input = await prompt(clc.cyan("TestFlight-URL oder ID: "));
      let url = input.startsWith(TESTFLIGHT_BASE_URL)
        ? input
        : `${TESTFLIGHT_BASE_URL}${input}`;

      if (urls.some((app) => app.url === url)) {
        displayMessage("\n❌ Diese URL wurde bereits hinzugefügt.", "error");
        displayMessage("🔙 Rückkehr zum Hauptmenü...", "info");
        await pause(3000);
        continue;
      }

      const isValid = await verifyURL(url);
      if (isValid) {
        urls.push({ name, url });
        saveURLs(urls);
        await sendPushoverNotification(
          userKey,
          appToken,
          "🆕 TestFlight-URL hinzugefügt",
          `Die TestFlight-Beta für ${name} ist jetzt verfügbar.\n\nURL: ${url}`
        );
        displayMessage("\n📲 Benachrichtigung gesendet.", "success");
        displayMessage("✅ Neue URL hinzugefügt.", "success");
        displayMessage("🔙 Rückkehr zum Hauptmenü...", "info");
        await pause(3000);
      } else {
        displayMessage(
          "❌ Die URL wurde nicht hinzugefügt, da sie ungültig ist.",
          "error"
        );
        displayMessage("🔙 Rückkehr zum Hauptmenü...", "info");
        await pause(3000);
      }
    } else if (choice === "2") {
      const index =
        parseInt(await prompt(clc.cyan("Nummer der zu löschenden URL: ")), 10) -
        1;
      if (index >= 0 && index < urls.length) {
        displayMessage(
          `\n🗑️ Lösche: ${urls[index].name} - ${urls[index].url}`,
          "error"
        );
        await sendPushoverNotification(
          userKey,
          appToken,
          "🗑️ TestFlight-URL gelöscht",
          `Die TestFlight-Beta für ${urls[index].name} wurde gelöscht.\n\nURL: ${urls[index].url}`
        );
        displayMessage("\n📲 Benachrichtigung gesendet.", "success");
        urls.splice(index, 1);
        saveURLs(urls);
        displayMessage("✅ URL gelöscht.", "success");
        displayMessage("🔙 Rückkehr zum Hauptmenü...", "info");
        await pause(3000);
      } else {
        displayMessage("❌ Ungültige Auswahl.", "error");
        await pause(3000);
      }
    } else if (choice === "3") {
      break;
    } else {
      displayMessage("❌ Ungültige Eingabe.", "error");
      await pause(3000);
    }
  }
}

async function sendPushoverNotification(userKey, appToken, title, message) {
  const pushover = new PushoverAPI(userKey, appToken);

  try {
    const response = await pushover.sendNotification(title, message, {
      priority: 0,
    });
    if (!response || response.status !== 1) {
      throw err;
    }
    return response;
  } catch (err) {
    throw err;
  }
}

async function configureEnvironment() {
  const env = loadEnv();
  displayMessage("\n🎉 Willkommen zum Setup!\n", "info");

  const questions = [
    {
      key: "OTP_SECRET",
      prompt:
        'Verschlüsselungsstring für das OTP (z.B. "768XuxTKWXKUPQ8fjfLxCtUQCVEKikq6")',
      defaultValue: "AendereDiesenString",
    },
    {
      key: "OTP_VALIDITY",
      prompt: 'Gültigkeitsdauer für das OTP in Minuten (z.B. "5" für 5 Min.)',
      defaultValue: "5 * 60 * 1000",
    },
    {
      key: "SETUP_FILE_NAME",
      prompt: "Name der Setup-Datei (Falls Du ihn angepasst hast)",
      defaultValue: "setup.js",
    },
    {
      key: "SERVER_FILE_NAME",
      prompt: "Name der Server-Datei (Falls Du ihn angepasst hast)",
      defaultValue: "index.js",
    },
    {
      key: "PORT",
      prompt: 'Port für den Server (z.B. "3000")',
      defaultValue: "3000",
    },
    {
      key: "HTTP_URL",
      prompt:
        "Auf welche Adresse ist der Webserver erreichbar? (z.B. http://localhost:3000)",
      defaultValue: "http://localhost:3000",
    },
    {
      key: "USER_AGENT",
      prompt: "User-Agent für Anfragen",
      defaultValue: "Testflight-Watcher/0.0.2 (Monitoring Script)",
    },
    {
      key: "PUSHOVER_PRIORITY",
      prompt:
        "Priorität der Benachrichtigung bei freier Beta (Niedrigste = -2; Niedrige = -1; Normale = 0; Hohe = 1; Kritische = 2)",
      defaultValue: "1",
    },
    {
      key: "CHECK_INTERVAL",
      prompt:
        "In welchem Abstand soll das Script nach einem neuen Platz prüfen in Sekunden (z.B. 30)",
      defaultValue: "30",
    },
  ];

  for (const { key, prompt: question, defaultValue } of questions) {
    if (env[key]) {
      displayMessage(
        `⏩ Überspringe: ${key} (bereits gesetzt: ${env[key]})`,
        "info"
      );
      continue;
    }

    let currentValue = defaultValue;
    const answer = await prompt(
      clc.cyan(`${question} [Standard: ${currentValue}]: `)
    );

    if (key === "OTP_VALIDITY") {
      const minutes = parseFloat(answer || "5");
      currentValue = `${minutes} * 60 * 1000`;
    } else {
      currentValue = answer || currentValue;
    }

    env[key] = currentValue;
    saveEnv(env);
  }

  saveEnv(env);
  displayMessage("\n📂 Standard-Konfiguration gespeichert.", "success");
}

(async () => {
  const env = loadEnv();
  await configureEnvironment();

  if (!env.PUSHOVER_USER_KEY || !env.PUSHOVER_APP_TOKEN) {
    env.PUSHOVER_USER_KEY = await prompt(
      clc.cyan("\nPushover-Benutzer-Schlüssel: ")
    );
    env.PUSHOVER_APP_TOKEN = await prompt(clc.cyan("Pushover-API-Token: "));

    let testApiSuccess = false;
    while (!testApiSuccess) {
      const testApi = await prompt(
        clc.yellow("Möchtest Du die Pushover-Verbindung testen? (") +
          clc.green("ja") +
          clc.yellow("/") +
          clc.red("nein") +
          clc.yellow("): ")
      );
      if (testApi.toLowerCase() === "ja") {
        try {
          await sendPushoverNotification(
            env.PUSHOVER_USER_KEY,
            env.PUSHOVER_APP_TOKEN,
            "Pushover-Verbindung",
            "Die Pushover-API ist erfolgreich konfiguriert!"
          );
          testApiSuccess = true;
          displayMessage(
            "✅ Die Verbindung zu Pushover war erfolgreich!",
            "success"
          );
          saveEnv(env);
          displayMessage(
            "\n\n📂 Pushover-Konfiguration gespeichert.",
            "success"
          );
          await pause(3000);
        } catch (error) {
          const retry = await prompt(
            clc.yellow("\nMöchtest Du die Daten korrigieren? (") +
              clc.green("ja") +
              clc.yellow("/") +
              clc.red("nein") +
              clc.yellow("): ")
          );
          if (retry.toLowerCase() === "ja") {
            env.PUSHOVER_USER_KEY = await prompt(
              clc.cyan("\nPushover-Benutzer-Schlüssel: ")
            );
            env.PUSHOVER_APP_TOKEN = await prompt(
              clc.cyan("Pushover-API-Token: ")
            );
            saveEnv(env);
          }
        }
      } else {
        displayMessage("\nVerbindungstest übersprungen.", "info");
        saveEnv(env);
        displayMessage("📂 Pushover-Konfiguration gespeichert.", "success");
        await pause(3000);
        testApiSuccess = true;
      }
    }
  } else {
    displayMessage("✅ Pushover ist bereits konfiguriert.", "success");
    await pause(3000);
  }

  displayMessage("\n🛠️ Verwalte TestFlight-URLs:", "info");
  await manageURLs(env.PUSHOVER_USER_KEY, env.PUSHOVER_APP_TOKEN);

  displayMessage("\n✅ Setup abgeschlossen!", "success");
})();

async function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearConsole() {
  process.stdout.write("\x1Bc");
}
