const http = require('http');

const data = JSON.stringify({
  type: 'INCOMING_CALL',
  receiverId: 'cmrbpdfit0000v5qg700cpnwc', // User 2
  roomId: 'test-room-123',
  isVideo: true,
  callerName: 'Dev User 1'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/calls/signal',
  method: 'POST',
  headers: {
    'Cookie': 'mock_userId=cmrbl8igt0002hkb01jqnjbge', // User 1
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
