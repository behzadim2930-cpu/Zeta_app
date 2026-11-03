/**
 * Cloudflare Pages _worker.js bundle
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Direct Telegram API Proxy:
    if (url.pathname.startsWith('/tg/')) {
      const tgPath = url.pathname.replace(/^\/tg\//, '');
      const tgUrl = new URL(`https://api.telegram.org/${tgPath}${url.search}`);
      return fetch(new Request(tgUrl, request));
    }

    // 2. Static assets fetch
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status < 400) {
          return assetRes;
        }
      } catch (_) {
        // Fallback
      }
    }

    // 3. Proxy to AI Studio origin
    const destination = new URL("https://ais-pre-sc62ancbog6atlg2ssl57i-512949655823.europe-west3.run.app");
    url.hostname = destination.hostname;
    url.protocol = destination.protocol;
    url.port = destination.port;

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: "follow",
    });

    return fetch(modifiedRequest);
  },
};
