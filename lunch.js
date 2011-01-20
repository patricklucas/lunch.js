const crypto = require('crypto'),
      fs = require('fs'),
      express = require('express'),
      lunchdb = require('./lunchdb');

var key = fs.readFileSync('lunch.key').toString();
var cert = fs.readFileSync('lunch.crt').toString();

var credentials = crypto.createCredentials({key: key, cert: cert});


var app = express.createServer();
app.setSecure(credentials);

app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{status: ok}');
});

app.get('/users/count.json', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    lunchdb.usersCount(function(err, count) {
        res.end('{users: {count: ' + count + '}}');
    });
});

lunchdb.connect(function(err) {
    app.listen(8000);
});
