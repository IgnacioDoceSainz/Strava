const REDIRECT_URI = 'https://ignaciodocesainz.github.io/Strava/';
const FALLBACK_CLIENT_ID = '237317';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Strava-Token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method === 'POST' && url.pathname === '/token') {
      let body = {};
      try { body = await request.json(); } catch(e) {}

      const clientId = env.CLIENT_ID || FALLBACK_CLIENT_ID;
      const clientSecret = env.CLIENT_SECRET;

      // DEBUG - remove after fixing
      if (body.debug) {
        return new Response(JSON.stringify({
          clientId,
          hasSecret: !!clientSecret,
          secretLength: clientSecret?.length,
          redirectUri: REDIRECT_URI,
          bodyCode: body.code?.slice(0,10)
        }), { headers: CORS });
      }

      const payload = body.refresh_token ? {
        client_id: clientId, client_secret: clientSecret,
        refresh_token: body.refresh_token, grant_type: 'refresh_token',
      } : {
        client_id: clientId, client_secret: clientSecret,
        code: body.code, grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      };

      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.text();
      return new Response(data, { status: res.status, headers: CORS });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
      const token = request.headers.get('X-Strava-Token');
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: CORS });
      const stravaPath = url.pathname.replace('/api', '');
      const res = await fetch('https://www.strava.com/api/v3' + stravaPath + url.search, {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const d = await res.text();
      return new Response(d, { status: res.status, headers: CORS });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS });
  }
};
