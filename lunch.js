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

app.get('/users/count.:format?', function(req, res) {
    lunchdb.usersCount(function(err, count) {
        if (req.params.format == 'txt') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('Number of users: ' + count);
        } else if (req.params.format == 'json') {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write('{users: {count: ' + count + '}}');
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('Number of users: <strong>' + count + '</strong>');
        }

        res.end();
    });
});

lunchdb.connect(function(err) {
    app.listen(8000);
});
