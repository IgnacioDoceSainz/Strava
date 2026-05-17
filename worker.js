
Copiar

// ─────────────────────────────────────────────────────────────
//  Strava Proxy — Cloudflare Worker
//  Deploy at: dash.cloudflare.com → Workers → Create Worker
//
//  Set these environment variables in the Worker settings:
//    STRAVA_CLIENT_ID     → 237317
//    STRAVA_CLIENT_SECRET → your client secret
// ─────────────────────────────────────────────────────────────
 
const REDIRECT_URI = 'https://ignaciodocesainz.github.io/Strava';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Strava-Token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};
 
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
 
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
 
    // POST /token — exchange code for access token
    if (request.method === 'POST' && url.pathname === '/token') {
      const { code } = await request.json().catch(() => ({}));
      if (!code) return json({ error: 'Missing code' }, 400);
 
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:     env.STRAVA_CLIENT_ID,
          client_secret: env.STRAVA_CLIENT_SECRET,
          code,
          grant_type:    'authorization_code',
          redirect_uri:  REDIRECT_URI,
        }),
      });
      const data = await res.text();
      return new Response(data, { status: res.status, headers: CORS });
    }
 
    // GET /api/* — proxy to Strava API
    if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
      const token = request.headers.get('X-Strava-Token');
      if (!token) return json({ error: 'No token' }, 401);
 
      const stravaPath = url.pathname.replace('/api', '');
      const stravaUrl  = 'https://www.strava.com/api/v3' + stravaPath + url.search;
 
      const res = await fetch(stravaUrl, {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await res.text();
      return new Response(data, { status: res.status, headers: CORS });
    }
 
    return json({ error: 'Not found' }, 404);
  },
};
 
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS });
}
 
