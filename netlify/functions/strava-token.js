const https = require('https');
 
const REDIRECT_URI = 'https://melodious-marshmallow-a02a9f.netlify.app';
 
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
 
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
 
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
 
  const { code } = body;
  if (!code) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
  }
 
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
 
  if (!clientId || !clientSecret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET environment variables in Netlify' }) };
  }
 
  const postData = JSON.stringify({
    client_id:     clientId,
    client_secret: clientSecret,
    code,
    grant_type:    'authorization_code',
    redirect_uri:  REDIRECT_URI
  });
 
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'www.strava.com',
      path: '/oauth/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('Strava token response:', res.statusCode, data.slice(0,200));
        resolve({ statusCode: res.statusCode, headers, body: data });
      });
    });
    req.on('error', e => {
      console.error('Token request error:', e.message);
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
    });
    req.write(postData);
    req.end();
  });
};
 
