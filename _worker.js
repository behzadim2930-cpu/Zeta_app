/**
 * Cloudflare Worker / Cloudflare Pages Full-Stack Proxy & Router
 * Automatically deployed when this repository is synced to GitHub!
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Direct Telegram API Proxy:
    // Bypasses Iran internet filtering with zero latency and delivers PDFs directly to chat!
    if (url.pathname.startsWith('/tg/')) {
      const tgPath = url.pathname.replace(/^\/tg\//, '');
      const tgUrl = new URL(`https://api.telegram.org/${tgPath}${url.search}`);
      return fetch(new Request(tgUrl, request));
    }

    // 2. If running on Cloudflare Pages with bundled static assets
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status < 400) {
          return assetRes;
        }
      } catch (_) {
        // Fallback to proxy
      }
    }

    // 3. Fallback: Proxy directly to Google AI Studio application
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
