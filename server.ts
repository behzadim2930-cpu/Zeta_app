import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// Telegram Bot API Proxy (Guarantees 100% unrestricted delivery from Europe server without requiring VPN for advisors)
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

let currentWebappUrl = process.env.PUBLIC_WEBAPP_URL || 'https://zeta-app.ketabkhan1234ketab.workers.dev/';

// Get current active Telegram WebApp URL
app.get('/api/telegram/getMenuUrl', (req, res) => {
  res.json({ ok: true, url: currentWebappUrl });
});

// Update Menu URL and update Telegram Bot menu button automatically
app.post('/api/telegram/updateMenuUrl', express.json(), async (req, res) => {
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

// Telegram Webhook Handler: When a consultant presses /start in Telegram, immediately reply that bot is connected & operational
app.post('/api/telegram/webhook', express.json(), async (req, res) => {
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

// App Start Notification Handler: Sends connection confirmation message to consultant when they launch the web app
app.post('/api/telegram/notifyStart', express.json(), async (req, res) => {
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

// Serve dist directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Zeta WebApp' });
});

// Catch-all SPA handler
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// If executed directly
if (process.env.NODE_ENV === 'production' || process.env.RUN_SERVER === 'true') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zeta WebApp Server listening on port ${PORT}`);
  });
}

export default app;
