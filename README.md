<a href="#" target="_blank"><img alt="Banner" src="https://pics.re/r/7tv16WJTaE.png?compress=false"></a>
# TestFlight Watcher 🚀

## Beschreibung 📜
Der **TestFlight Watcher** ist ein Skript, das TestFlight-Betas überwacht und Benachrichtigungen versendet, wenn neue Plätze für Betatests verfügbar sind. Es prüft regelmäßig die angegebenen TestFlight-URLs und benachrichtigt den Benutzer, wenn Plätze verfügbar werden. Diese Benachrichtigungen werden über die [Pushover-API](https://pushover.net/) versendet.

## Funktionen 🛠️
- Überwachung von TestFlight-Betas.
- Senden von Benachrichtigungen bei Verfügbarkeit von Testplätzen.
- Einfache Verwaltung der zu überwachenden URLs über eine Konfigurationsdatei oder über das Setup-Script.
- Webserver zum Löschen von bereits angenommenen Beta-Einladungen.
- Einstellbare Priorität
- Einstellbares Prüfinterval
  
## Installation 💻

### Voraussetzungen
- Internetverbindung
- 128MB Arbeitsspeicher
- 0,5 - 1 Thread
- [Node.js](https://nodejs.org/) (Version 12 oder höher)
- [Pushover Account](https://pushover.net/) (für Benachrichtigungen)

### Schritte
1. **Klone das Repository:**
   ```bash
   git clone https://github.com/MaximilianGT500/testflight-watcher.git
   cd testflight-watcher
   ```

2. **Installiere die benötigten Pakete:**
   ```bash
   npm install
   ```

3. **Erstellung der `.env`-Datei:**
   Falls noch nicht vorhanden, erstelle die `.env`-Datei, indem Du den Setup-Prozess ausführen:
   ```bash
   node setup.js / npm run setup
   ```

4. **Starte das Skript:**
   ```bash
   node index.js / npm start
   ```

## Konfiguration ⚙️

In der `.env`-Datei müssen folgende Variablen konfiguriert werden:

- **PUSHOVER_USER_KEY**: Dein Pushover-Benutzer-Schlüssel.
- **PUSHOVER_APP_TOKEN**: Dein Pushover-App-Token.
- **TESTFLIGHT_URLS**: Eine Liste der TestFlight-URLs, die überwacht werden sollen. Beispiel:
  ```json
  [{ "name": "App 1", "url": "https://testflight.apple.com/join/abcd1234" },{ "name": "App 2", "url": "https://testflight.apple.com/join/xyz5678" }]
  ```

- **OTP_SECRET**: Ein geheimer Schlüssel für die OTP-Generierung.
- **OTP_VALIDITY**: Die Gültigkeitsdauer des OTP in Sekunden (Standard: 300).
- **USER_AGENT**: Der User-Agent für Anfragen an die TestFlight-URLs.
- **PORT**: Der Port, auf dem der Webserver läuft (Standard: 3000).
- **HTTP_URL**: Die URL des Webservers (Standard: `http://localhost:3000`).
- **PUSHOVER_PRIORITY**: Die Priorität der Benachrichtigungen bei freier Beta. (Standard: 1)
- **CHECK_INTERVAL**: Wie oft soll nach ein freien Platz geprüft werden? (Standard: 30)
  
### Beispiel `.env`-Datei:
```env
PUSHOVER_USER_KEY=dein_pushover_benutzer_key
PUSHOVER_APP_TOKEN=dein_pushover_app_token
TESTFLIGHT_URLS='[{"name":"App 1", "url":"https://testflight.apple.com/join/abcd1234"}]'
OTP_SECRET=AendereDiesenString
OTP_VALIDITY=300
USER_AGENT=Testflight-Watcher/0.0.2
PORT=3000
HTTP_URL=http://localhost:3000
PUSHOVER_PRIORITY=1
CHECK_INTERVAL=30
```

## Nutzung 🚀

### Überwachung starten
Nachdem das Skript erfolgreich gestartet wurde, überwacht es kontinuierlich die angegebenen TestFlight-URLs und prüft standardmäßig alle 30 Sekunden auf ein neuen Platz.

### Benachrichtigungen
Wenn ein Platz für einen TestFlight-Betatests verfügbar ist, wird automatisch eine Benachrichtigung an den angegebenen Pushover-Benutzer gesendet.

### URLs verwalten
Du kannst TestFlight-URLs über die Konsole verwalten, indem du die `.env`-Datei bearbeitest oder `npm run setup` bzw. `node setup.js` ausführst.

## Setup 📦
Beim ersten Start des Skripts musst Du die Konfiguration einrichten. Falls die `.env`-Datei fehlt oder unvollständig ist, wird automatisch das Setup gestartet, um die fehlenden Werte zu konfigurieren.

## Debugging und Fehlerbehebung ⚠️

- **Fehlende `.env`-Datei**: Wenn die `.env`-Datei fehlt, startet das Skript den Setup-Prozess automatisch.
- **Pushover-Benachrichtigungen**: Überprüfe, ob der Benutzer-Schlüssel und das App-Token korrekt sind, wenn keine Benachrichtigungen gesendet werden.
- **TestFlight-URLs**: Stelle sicher, dass die URLs korrekt sind und auf existierende Betatests verweisen.

## Lizenz 📄
Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die [LICENSE](LICENSE)-Datei für Details.

---
