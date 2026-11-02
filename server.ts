import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Increase payload limits for PDF transfers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS and remove frame restrictions for Telegram WebApp
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw';
let currentWebappUrl = process.env.PUBLIC_WEBAPP_URL || 'https://zeta-app.ketabkhan1234ketab.workers.dev/';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Zeta WebApp' });
});

// Direct Telegram Proxy Route: /tg/* -> https://api.telegram.org/*
app.all('/tg/*', async (req, res) => {
  try {
    const tgPath = req.url.replace(/^\/tg\//, '');
    const tgUrl = `https://api.telegram.org/${tgPath}`;
    const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;
    const contentType = req.headers['content-type'];
    const fetchOptions: any = {
      method: req.method,
      headers: contentType ? { 'Content-Type': contentType } : undefined,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': 'application/json' };
      }
    }
    const resp = await fetch(tgUrl, fetchOptions);
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Telegram Bot API Proxy: getMe
app.get('/api/telegram/getMe', async (req, res) => {
  try {
    const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;
    const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await resp.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, description: err.message });
  }
});

// Get current active Telegram WebApp URL
app.get('/api/telegram/getMenuUrl', (req, res) => {
  res.json({ ok: true, url: currentWebappUrl });
});

// Update Menu URL and update Telegram Bot menu button automatically
app.post('/api/telegram/updateMenuUrl', async (req, res) => {
  try {
    const { url, token } = req.body || {};
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return res.status(400).json({ ok: false, error: 'آدرس وارد شده باید یک آدرس معتبر https باشد.' });
    }
    const cleanUrl = url.trim();
    currentWebappUrl = cleanUrl;
    const botToken = token || DEFAULT_BOT_TOKEN;

    // Call Telegram setChatMenuButton
    const menuResp = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '📅 برنامه هفتگی',
          web_app: { url: cleanUrl },
        },
      }),
    });
    const menuData = await menuResp.json();
    return res.json({ ok: true, currentWebappUrl: cleanUrl, telegramResult: menuData });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Telegram Webhook Handler
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    const msg = update?.message;
    if (msg && msg.chat && msg.chat.id) {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || 'مشاور گرامی';
      
      const welcomeText = `🌟 سلام ${firstName}، به ربات هوشمند برنامه‌ریزی هفتگی موسسه آموزشی و مشاوره‌ای زتا (Zeta) خوش آمدید!\n\n✅ ربات با موفقیت متصل است و هیچ مشکلی ندارد.\n\n📋 جهت شروع ثبت و ویرایش برنامه درسی دانش‌آموز خود و دریافت مستقیم فایل PDF قطع استاندارد فیزیکی A4، دکمه زیر را لمس فرمایید:`;

      await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📅 ورود به پنل برنامه‌ریزی هفتگی',
                  web_app: { url: currentWebappUrl },
                },
              ],
            ],
          },
        }),
      });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.json({ ok: true });
  }
});

// App Start Notification Handler
app.post('/api/telegram/notifyStart', async (req, res) => {
  try {
    const { chatId, firstName } = req.body || {};
    if (!chatId) {
      return res.status(400).json({ ok: false, error: 'chatId is required' });
    }
    const name = firstName || 'مشاور گرامی';
    const text = `🌟 سلام ${name}، به سامانه برنامه‌ریزی هفتگی موسسه زتا (Zeta) خوش آمدید!\n\n✅ ربات با موفقیت متصل است و هیچ مشکلی وجود ندارد.\n\n📋 هم‌اکنون می‌توانید مشخصات دانش‌آموز را وارد کرده و پس از تنظیم پارت‌ها، با زدن دکمه «دریافت مستقیم PDF»، فایل را در همین چت تحویل بگیرید.`;
    
    const resp = await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const data = await resp.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * HIGH-SPEED SERVER-SIDE TELEGRAM PDF DISPATCHER (100% Reliable without VPN in Iran)
 * Receives base64-encoded PDF from the frontend, packs into FormData, and dispatches to Telegram API.
 */
app.post('/api/telegram/sendPdf', async (req, res) => {
  try {
    const { chatId, pdfBase64, filename, caption, token } = req.body || {};

    if (!chatId || !pdfBase64) {
      return res.status(400).json({ ok: false, description: 'chatId و فایل PDF الزامی است.' });
    }

    const activeToken = (token as string) || DEFAULT_BOT_TOKEN;
    const finalFilename = filename || 'Zeta_Weekly_Plan.pdf';
    const finalCaption = caption || '📋 برنامه هفتگی موسسه زتا (@Zetagroupbot)';

    // Convert base64 into a binary Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Construct FormData for Telegram API
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('document', pdfBlob, finalFilename);
    formData.append('caption', finalCaption);

    const tgResp = await fetch(`https://api.telegram.org/bot${activeToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const tgData = await tgResp.json();
    return res.status(tgResp.status).json(tgData);
  } catch (err: any) {
    console.error('Error in sendPdf proxy:', err);
    return res.status(500).json({ ok: false, description: `خطای سرور پروکسی: ${err.message}` });
  }
});

// Raw multipart fallback
app.post('/api/telegram/sendDocument', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;
    const contentType = req.headers['content-type'] || 'multipart/form-data';
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      headers: {
        'content-type': contentType,
      },
      body: req.body,
    });
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, description: err.message });
  }
});

// Static files or Vite middlewares
if (isDev) {
  // In development, mount Vite's dev server middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Production: serve static build with anti-cache headers for HTML
  const distPath = path.join(__dirname, 'dist');
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Zeta WebApp Server listening on port ${PORT} (isDev: ${isDev})`);
});

export default app;
