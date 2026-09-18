const http = require('http');

const data = JSON.stringify({ action: 'create', name: 'TestTeam123', user_id: 'test-user-id' });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/teams',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
