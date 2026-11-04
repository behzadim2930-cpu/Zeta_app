/**
 * Zeta Cloudflare Worker & Pages Edge Router
 * 100% Unblocked Telegram Reverse Proxy for Iran (Zero VPN Required)
 * Handles CORS preflight, FormData streaming, and Base64 PDF dispatch.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. CORS Preflight Handler (Fixes "Failed to fetch" on mobile & web in Iran)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Helper to add CORS headers to any response
    const addCors = (response) => {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', '*');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    };

    // 2. High-Speed Base64 Telegram PDF Dispatcher (/api/telegram/sendPdf)
    if (url.pathname === '/api/telegram/sendPdf' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { chatId, pdfBase64, filename, caption, token } = body || {};
        const activeToken = token || '8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw';

        if (!chatId || !pdfBase64) {
          return addCors(new Response(JSON.stringify({ ok: false, description: 'chatId و فایل PDF الزامی است.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }));
        }

        // Decode Base64 to binary Uint8Array
        const binaryString = atob(pdfBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('document', pdfBlob, filename || 'Zeta_Weekly_Plan.pdf');
        if (caption) {
          formData.append('caption', caption);
        }

        const tgResp = await fetch(`https://api.telegram.org/bot${activeToken}/sendDocument`, {
          method: 'POST',
          body: formData,
        });

        const tgData = await tgResp.json();
        return addCors(new Response(JSON.stringify(tgData), {
          status: tgResp.status,
          headers: { 'Content-Type': 'application/json' },
        }));
      } catch (err) {
        return addCors(new Response(JSON.stringify({ ok: false, description: `خطای پروکسی: ${err.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    // 3. Telegram Updates Proxy (/api/telegram/getLatestChatId)
    if (url.pathname === '/api/telegram/getLatestChatId') {
      try {
        const token = url.searchParams.get('token') || '8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw';
        const tgResp = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const data = await tgResp.json();
        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          for (let i = data.result.length - 1; i >= 0; i--) {
            const item = data.result[i];
            const m = item?.message;
            if (m && m.chat && m.chat.id) {
              return addCors(new Response(JSON.stringify({
                ok: true,
                chatId: String(m.chat.id),
                firstName: m.from?.first_name || m.chat.first_name || 'مشاور گرامی',
                username: m.from?.username || m.chat.username || '',
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }));
            }
          }
        }
        return addCors(new Response(JSON.stringify({ ok: false, error: 'پیامی یافت نشد' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      } catch (err) {
        return addCors(new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    // 4. Direct Telegram Reverse Proxy (/tg/* or /bot*)
    if (url.pathname.startsWith('/tg/') || url.pathname.startsWith('/bot')) {
      const tgPath = url.pathname.startsWith('/tg/')
        ? url.pathname.replace(/^\/tg\//, '')
        : url.pathname.replace(/^\//, '');
      const tgUrl = `https://api.telegram.org/${tgPath}${url.search}`;

      // Clean headers for Telegram API (remove host and Cloudflare-internal headers)
      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const l = key.toLowerCase();
        if (l !== 'host' && l !== 'content-length' && !l.startsWith('cf-')) {
          forwardHeaders.set(key, value);
        }
      }

      try {
        const tgResp = await fetch(tgUrl, {
          method: request.method,
          headers: forwardHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });
        return addCors(tgResp);
      } catch (err) {
        return addCors(new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
    }

    // 5. Cloudflare Pages bundled static assets
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status < 400) {
          return assetRes;
        }
      } catch (_) {}
    }

    // 6. Fallback to origin
    return new Response('Not found', { status: 404 });
  },
};
