// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var isDev = process.env.NODE_ENV !== "production";
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});
var DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw";
var currentWebappUrl = process.env.PUBLIC_WEBAPP_URL || "https://zeta-app.ketabkhan1234ketab.workers.dev/";
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Zeta WebApp" });
});
app.all("/tg/*", async (req, res) => {
  try {
    const tgPath = req.url.replace(/^\/tg\//, "");
    const tgUrl = `https://api.telegram.org/${tgPath}`;
    const token = req.query.token || DEFAULT_BOT_TOKEN;
    const contentType = req.headers["content-type"];
    const fetchOptions = {
      method: req.method,
      headers: contentType ? { "Content-Type": contentType } : void 0
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (typeof req.body === "object" && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers = { ...fetchOptions.headers, "Content-Type": "application/json" };
      }
    }
    const resp = await fetch(tgUrl, fetchOptions);
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
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
app.get("/api/telegram/getMenuUrl", (req, res) => {
  res.json({ ok: true, url: currentWebappUrl });
});
app.post("/api/telegram/updateMenuUrl", async (req, res) => {
  try {
    const { url, token } = req.body || {};
    if (!url || typeof url !== "string" || !url.startsWith("https://")) {
      return res.status(400).json({ ok: false, error: "\u0622\u062F\u0631\u0633 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0628\u0627\u06CC\u062F \u06CC\u06A9 \u0622\u062F\u0631\u0633 \u0645\u0639\u062A\u0628\u0631 https \u0628\u0627\u0634\u062F." });
    }
    const cleanUrl = url.trim();
    currentWebappUrl = cleanUrl;
    const botToken = token || DEFAULT_BOT_TOKEN;
    const menuResp = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "\u{1F4C5} \u0628\u0631\u0646\u0627\u0645\u0647 \u0647\u0641\u062A\u06AF\u06CC",
          web_app: { url: cleanUrl }
        }
      })
    });
    const menuData = await menuResp.json();
    return res.json({ ok: true, currentWebappUrl: cleanUrl, telegramResult: menuData });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/telegram/webhook", async (req, res) => {
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
                  web_app: { url: currentWebappUrl }
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
app.get("/api/telegram/getLatestChatId", async (req, res) => {
  try {
    const token = req.query.token || DEFAULT_BOT_TOKEN;
    const resp = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await resp.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      for (let i = data.result.length - 1; i >= 0; i--) {
        const item = data.result[i];
        const m = item?.message;
        if (m && m.chat && m.chat.id) {
          const cid = String(m.chat.id);
          return res.json({
            ok: true,
            chatId: cid,
            firstName: m.from?.first_name || m.chat.first_name || "\u0645\u0634\u0627\u0648\u0631 \u06AF\u0631\u0627\u0645\u06CC",
            username: m.from?.username || m.chat.username || ""
          });
        }
      }
    }
    return res.json({
      ok: false,
      error: "\u0647\u06CC\u0686 \u067E\u06CC\u0627\u0645\u06CC \u062F\u0631 \u0631\u0628\u0627\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0627\u0628\u062A\u062F\u0627 \u062F\u0631 \u0631\u0628\u0627\u062A @Zetagroupbot \u062F\u0633\u062A\u0648\u0631 /start \u06CC\u0627 \u06CC\u06A9 \u067E\u06CC\u0627\u0645 \u0627\u0631\u0633\u0627\u0644 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F."
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/telegram/notifyStart", async (req, res) => {
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
app.post("/api/telegram/sendPdf", async (req, res) => {
  try {
    const { chatId, pdfBase64, filename, caption, token } = req.body || {};
    if (!chatId || !pdfBase64) {
      return res.status(400).json({ ok: false, description: "chatId \u0648 \u0641\u0627\u06CC\u0644 PDF \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const activeToken = token || DEFAULT_BOT_TOKEN;
    const finalFilename = filename || "Zeta_Weekly_Plan.pdf";
    const finalCaption = caption || "\u{1F4CB} \u0628\u0631\u0646\u0627\u0645\u0647 \u0647\u0641\u062A\u06AF\u06CC \u0645\u0648\u0633\u0633\u0647 \u0632\u062A\u0627 (@Zetagroupbot)";
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("document", pdfBlob, finalFilename);
    formData.append("caption", finalCaption);
    const tgResp = await fetch(`https://api.telegram.org/bot${activeToken}/sendDocument`, {
      method: "POST",
      body: formData
    });
    const tgData = await tgResp.json();
    if (!tgData.ok) {
      if (tgData.description?.includes("blocked")) {
        tgData.persianMessage = `\u0627\u06A9\u0627\u0646\u062A \u062A\u0644\u06AF\u0631\u0627\u0645 (${chatId}) \u0631\u0628\u0627\u062A @Zetagroupbot \u0631\u0627 \u0645\u0633\u062F\u0648\u062F (Stop / Block) \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645 \u0648\u0627\u0631\u062F \u0686\u062A @Zetagroupbot \u0634\u062F\u0647 \u0648 \u062F\u06A9\u0645\u0647 Start (\u0634\u0631\u0648\u0639 \u0645\u062C\u062F\u062F) \u0631\u0627 \u0628\u0632\u0646\u06CC\u062F \u062A\u0627 \u0631\u0641\u0639 \u0645\u0633\u062F\u0648\u062F\u06CC \u0634\u0648\u062F.`;
      } else if (tgData.description?.includes("can't initiate") || tgData.description?.includes("chat not found")) {
        tgData.persianMessage = `\u0631\u0628\u0627\u062A @Zetagroupbot \u0627\u062C\u0627\u0632\u0647 \u0634\u0631\u0648\u0639 \u06AF\u0641\u062A\u06AF\u0648 \u0628\u0627 \u0686\u062A (${chatId}) \u0631\u0627 \u0646\u062F\u0627\u0631\u062F \u0632\u06CC\u0631\u0627 \u0647\u0646\u0648\u0632 \u0631\u0628\u0627\u062A \u0627\u0633\u062A\u0627\u0631\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062F\u06A9\u0645\u0647 Start \u0631\u0627 \u062F\u0631 \u0686\u062A \u0631\u0628\u0627\u062A \u0644\u0645\u0633 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F.`;
      }
    }
    return res.status(tgResp.status).json(tgData);
  } catch (err) {
    console.error("Error in sendPdf proxy:", err);
    return res.status(500).json({ ok: false, description: `\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 \u067E\u0631\u0648\u06A9\u0633\u06CC: ${err.message}` });
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
if (isDev) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    })
  );
  app.get("*", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(distPath, "index.html"));
  });
}
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zeta WebApp Server listening on port ${PORT} (isDev: ${isDev})`);
});
var server_default = app;
export {
  server_default as default
};
