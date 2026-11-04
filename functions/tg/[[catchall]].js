/**
 * Cloudflare Pages Function: /tg/[[catchall]]
 * Forwards requests directly to https://api.telegram.org/* with full CORS support.
 */

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.catchall) ? params.catchall.join('/') : (params.catchall || '');
  const url = new URL(request.url);
  const tgUrl = `https://api.telegram.org/${path}${url.search}`;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

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

    const respHeaders = new Headers(tgResp.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(tgResp.body, {
      status: tgResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
