
# TestFlight-Watcher 📱🚀

Ein Node.js-Skript, das automatisch TestFlight-Einladungslinks überwacht und Benachrichtigungen ausgibt, sobald ein neuer Platz verfügbar ist.

---

## Features 🌟

- **Automatische Überwachung**: Regelmäßiges Überprüfen von TestFlight-Links standartmäßig jede 30 Sekunden.
- **Benachrichtigungen**: Sendet eine Benachrichtigung über Pushover, wenn Plätze verfügbar sind.
- **Anpassbare Intervalle**: Kontrolliere, wie oft die Links geprüft werden.
- **Plattformübergreifend**: Funktioniert auf allen Systemen, die Node.js unterstützen.

---

## Voraussetzungen 📋

- **Node.js** (v18+ empfohlen)
- **npm**
- **nodemon**

---

## Installation 🚀

1. Klone das Repository:
   ```bash
   git clone https://github.com/MaximilianGT500/testflight-watcher
   cd testflight-watcher
   ```

2. Installiere die Abhängigkeiten:
   ```bash
   npm install
   npm i nodemon -g
   ```

3. Konfiguriere die Anwendung, indem du `npm start` oder `node setup.js` ausführst.

---

## Verwendung 🛠️

Starte das Skript mit:
```bash
npm start
bzw.
nodemon index.js
```
Das Skript überprüft die angegebenen Links im konfigurierten Intervall und gibt in der Konsole aus und Benarichtigt dich per Pushover, ob ein Platz verfügbar ist.

---

## Benachrichtigungen 📩

Das Skript unterstützt derzeit:
- **Konsolenausgabe**: Zeigt in der Konsole an, wenn ein Platz verfügbar ist.
- **Pushover**: Sendet eine Benachrichtigung mit einer konfigurierbaren Priorität an deine Pushover Geräte.

---

## Abhängigkeiten 🛠️

Die wichtigsten verwendeten Bibliotheken:
- **fs**: Eingebautes Modul für Dateisystemoperationen.
- **readline:** Eingebautes Modul für Konsoleneingaben/-ausgaben.
- **axios**: Für HTTP-Anfragen.
- **cli-color**: Für farbige Konsolenausgabe.
- **PushoverAPI,js**: Eigener Wrapper für die Integration mit Pushover.
---

## Bekannte Probleme 🐞

- **Rate-Limiting**: Die TestFlight-Website könnte die Anfragen blockieren, wenn sie zu oft gestellt werden. Passe das Intervall entsprechend an.

---

## Beitragen 🤝

Pull Requests sind willkommen! Für größere Änderungen, öffne bitte zuerst ein Issue, um die Änderung zu besprechen.

---

## Lizenz 📜

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

---

### Viel Spaß beim nutzen!
