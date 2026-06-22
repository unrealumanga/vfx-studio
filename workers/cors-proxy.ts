export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://unrealumanga.github.io',
      'http://localhost:5173',
    ];

    if (!origin || !allowedOrigins.some((o) => origin.startsWith(o))) {
      return new Response('Forbidden', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }), origin);
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('target');
    if (!target) return new Response('Missing target parameter', { status: 400 });

    const proxyReq = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    proxyReq.headers.delete('Origin');

    try {
      const res = await fetch(proxyReq);
      return corsResponse(new Response(res.body, res), origin);
    } catch (e) {
      return new Response(`Proxy error: ${e}`, { status: 502 });
    }
  },
};

function corsResponse(res: Response, origin: string): Response {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');
  return new Response(res.body, { status: res.status, headers });
}
