const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const { code } = JSON.parse(event.body || '{}');
  if (!code) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
  }

  const postData = JSON.stringify({
    client_id:     process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code'
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
      res.on('end', () => resolve({ statusCode: res.statusCode, headers, body: data }));
    });
    req.on('error', e => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
    req.write(postData);
    req.end();
  });
};
