// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});
var DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw";
app.get("/api/telegram/getMe", async (req, res) => {
  try {
    const token = req.query.token || DEFAULT_BOT_TOKEN;
    const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, description: err.message });
  }
});
var WEBAPP_URL = process.env.PUBLIC_WEBAPP_URL || "https://ais-pre-sc62ancbog6atlg2ssl57i-512949655823.europe-west3.run.app";
app.post("/api/telegram/webhook", express.json(), async (req, res) => {
  try {
    const update = req.body;
    const msg = update?.message;
    if (msg && msg.chat && msg.chat.id) {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || "\u0645\u0634\u0627\u0648\u0631 \u06AF\u0631\u0627\u0645\u06CC";
      const welcomeText = `\u{1F31F} \u0633\u0644\u0627\u0645 ${firstName}\u060C \u0628\u0647 \u0631\u0628\u0627\u062A \u0647\u0648\u0634\u0645\u0646\u062F \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u0647\u0641\u062A\u06AF\u06CC \u0645\u0648\u0633\u0633\u0647 \u0622\u0645\u0648\u0632\u0634\u06CC \u0648 \u0645\u0634\u0627\u0648\u0631\u0647\u200C\u0627\u06CC \u0632\u062A\u0627 (Zeta) \u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F!

\u2705 \u0631\u0628\u0627\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0645\u062A\u0635\u0644 \u0627\u0633\u062A \u0648 \u0647\u06CC\u0686 \u0645\u0634\u06A9\u0644\u06CC \u0646\u062F\u0627\u0631\u062F.

\u{1F4CB} \u062C\u0647\u062A \u0634\u0631\u0648\u0639 \u062B\u0628\u062A \u0648 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0628\u0631\u0646\u0627\u0645\u0647 \u062F\u0631\u0633\u06CC \u062F\u0627\u0646\u0634\u200C\u0622\u0645\u0648\u0632 \u062E\u0648\u062F \u0648 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u0633\u062A\u0642\u06CC\u0645 \u0641\u0627\u06CC\u0644 PDF \u0642\u0637\u0639 \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F \u0641\u06CC\u0632\u06CC\u06A9\u06CC A4\u060C \u062F\u06A9\u0645\u0647 \u0632\u06CC\u0631 \u0631\u0627 \u0644\u0645\u0633 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F:`;
      await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u{1F4C5} \u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u0647\u0641\u062A\u06AF\u06CC",
                  web_app: { url: WEBAPP_URL }
                }
              ]
            ]
          }
        })
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.json({ ok: true });
  }
});
app.post("/api/telegram/notifyStart", express.json(), async (req, res) => {
  try {
    const { chatId, firstName } = req.body || {};
    if (!chatId) {
      return res.status(400).json({ ok: false, error: "chatId is required" });
    }
    const name = firstName || "\u0645\u0634\u0627\u0648\u0631 \u06AF\u0631\u0627\u0645\u06CC";
    const text = `\u{1F31F} \u0633\u0644\u0627\u0645 ${name}\u060C \u0628\u0647 \u0633\u0627\u0645\u0627\u0646\u0647 \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u0647\u0641\u062A\u06AF\u06CC \u0645\u0648\u0633\u0633\u0647 \u0632\u062A\u0627 (Zeta) \u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F!

\u2705 \u0631\u0628\u0627\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0645\u062A\u0635\u0644 \u0627\u0633\u062A \u0648 \u0647\u06CC\u0686 \u0645\u0634\u06A9\u0644\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.

\u{1F4CB} \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0645\u0634\u062E\u0635\u0627\u062A \u062F\u0627\u0646\u0634\u200C\u0622\u0645\u0648\u0632 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0631\u062F\u0647 \u0648 \u067E\u0633 \u0627\u0632 \u062A\u0646\u0638\u06CC\u0645 \u067E\u0627\u0631\u062A\u200C\u0647\u0627\u060C \u0628\u0627 \u0632\u062F\u0646 \u062F\u06A9\u0645\u0647 \xAB\u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u0633\u062A\u0642\u06CC\u0645 PDF\xBB\u060C \u0641\u0627\u06CC\u0644 \u0631\u0627 \u062F\u0631 \u0647\u0645\u06CC\u0646 \u0686\u062A \u062A\u062D\u0648\u06CC\u0644 \u0628\u06AF\u06CC\u0631\u06CC\u062F.`;
    const resp = await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/telegram/sendDocument", express.raw({ type: "*/*", limit: "50mb" }), async (req, res) => {
  try {
    const token = req.query.token || DEFAULT_BOT_TOKEN;
    const contentType = req.headers["content-type"] || "multipart/form-data";
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      headers: {
        "content-type": contentType
      },
      body: req.body
    });
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, description: err.message });
  }
});
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Zeta WebApp" });
});
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
if (process.env.NODE_ENV === "production" || process.env.RUN_SERVER === "true") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zeta WebApp Server listening on port ${PORT}`);
  });
}
var server_default = app;
export {
  server_default as default
};
