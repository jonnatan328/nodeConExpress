var path = require('path');
var app = require('express')();
var ws = require('express-ws')(app);
app.get('/', (req, res) => {
  console.error('express connection');
  res.sendFile(path.join(__dirname, 'websocketClient.html'));
});
app.ws('/', (s, req) => {
  console.error('websocket connection');
  for (var t = 0; t < 3; t++)
    setTimeout(() => s.send('message from server', ()=>{}), 1000*t);
});
app.listen(3001, () => console.error('listening on http://localhost:3001/'));
console.error('websocket example');