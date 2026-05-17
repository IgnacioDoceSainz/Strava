const REDIRECT_URI = 'https://ignaciodocesainz.github.io/Strava';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Strava-Token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method === 'POST' && url.pathname === '/token') {
    let code;
    try { const body = await request.json(); code = body.code; } catch(e) {}
    if (!code) return new Response(JSON.stringify({ error: 'Missing code' }), { status: 400, headers: CORS });

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  REDIRECT_URI,
      }),
    });
    const data = await res.text();
    return new Response(data, { status: res.status, headers: CORS });
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    const token = request.headers.get('X-Strava-Token');
    if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: CORS });

    const stravaPath = url.pathname.replace('/api', '');
    const stravaUrl  = 'https://www.strava.com/api/v3' + stravaPath + url.search;

    const res = await fetch(stravaUrl, {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const data = await res.text();
    return new Response(data, { status: res.status, headers: CORS });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS });
}
