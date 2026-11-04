/**
 * Cloudflare Pages Function: /api/telegram/sendPdf
 * High-speed Base64 PDF receiver and Telegram dispatcher.
 */

export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json();
    const { chatId, pdfBase64, filename, caption, token } = body || {};
    const activeToken = token || '8915898130:AAFVjJnKCsQvYkKOlqpzOVEvJMcKkFdlTvw';

    if (!chatId || !pdfBase64) {
      return new Response(JSON.stringify({ ok: false, description: 'chatId و فایل PDF الزامی است.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

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
    return new Response(JSON.stringify(tgData), {
      status: tgResp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, description: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
