var sys = require("sys");
var io = require('./vendor/socket.io');

var ws_port = 8080;
io.listen(ws_port);

io.sockets.on('connection', function (socket) {
  io.sockets.emit('this', { will: 'be received by everyone' });

  socket.on('private message', function (from, msg) {
    console.log('I received a private message by ', from, ' saying ', msg);
  });

  socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
});


/*
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Please, use WebSocket Server at '+ws_port+' port\n');
}).listen(80, "127.0.0.1");
console.log('Server running at http://127.0.0.1:80/');
*/
