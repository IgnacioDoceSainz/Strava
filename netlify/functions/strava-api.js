const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Strava-Token',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const token = event.headers['x-strava-token'];
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) };

  // path comes after /.netlify/functions/strava-api/
  const stravaPath = event.path.replace('/.netlify/functions/strava-api', '') || '/athlete';
  const qs = event.rawQuery ? '?' + event.rawQuery : '';

  return new Promise((resolve) => {
    https.get({
      hostname: 'www.strava.com',
      path: '/api/v3' + stravaPath + qs,
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers, body: data }));
    }).on('error', e => resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }));
  });
};
