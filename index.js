#! /usr/bin/env node

// standard modules
var https = require('https')
  , http = require('http')
  , fs = require('fs')
  , url = require('url');

// third party modules
var connect = require('connect')
  , io = require('socket.io');

// options
var target = process.argv[2]
  , port = process.argv[3] || 3000

var server = connect()
  .use(connect.static(__dirname))
  .listen(port);

io = io.listen(server);

io.configure('development', function() {
  io.set('log level', 1);
  io.set('transports', ['websocket']);
});

io.sockets.on('connection', function(socket) {
  read(target, function(err, data) {
    socket.emit('md', data);
  });
  change(target, function(err, data) {
    socket.emit('md', data);
  });
});

function request(str, cb) {
  var options = {
    host: 'api.github.com',
    path: '/markdown/raw',
    method: 'POST',
    headers: {
      'Content-length': str.length,
      'Content-Type': 'text/plain'
    }
  };

  var req = https.request(options, function(res) {
    var response = [];
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      response.push(chunk);
    });
    res.on('end', function() {
      cb(null, response.join());
    });
  });

  req.on('error', function(e) {
    cb('\033[31m' + e.message + '\033[0m');
  });

  req.write(str);
  req.end();
}

function read(path, cb) {
  fs.readFile(path, function(err, data) {
    request(data, cb);
  });
}

function watch(path, cb) {
  fs.watchFile(path, {interval: 10}, function(curr, prev) {
    read(path, cb);
  });
}

function change(path, cb) {
  watch(path, cb);
}

