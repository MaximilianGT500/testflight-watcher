const axios = require("axios");
const HTTP_STATUS_OK = 200;

class PushoverAPI {
  constructor(userKey, appToken) {
    this.userKey = userKey;
    this.appToken = appToken;
    this.url = "https://api.pushover.net:443/1/messages.json";
  }

  async sendNotification(title, message, options = {}) {
    const data = {
      user: this.userKey,
      token: this.appToken,
      message: message,
      title: title,
      priority: 0,
      ...options,
    };

    try {
      const response = await axios.post(this.url, new URLSearchParams(data));

      if (response.status === HTTP_STATUS_OK) {
        console.log("✅ Die Nachricht wurde erfolgreich gesendet!");
        return response.data;
      } else {
        console.error(
          `❌ Fehler: Unbekannter Fehler beim Senden der Nachricht. Statuscode: ${response.status}`
        );
        return null;
      }
    } catch (error) {
      if (error.response) {
        console.error(`❌ Fehler von Pushover: ${error.response.data.errors}`);
        console.error(`🔧 Statuscode: ${error.response.status}`);
      } else if (error.request) {
        console.error("❌ Fehler bei der Anfrage: Keine Antwort erhalten.");
      } else {
        console.error("❌ Fehler: " + error.message);
      }
      return null;
    }
  }
}

module.exports = PushoverAPI;
