const crypto = require('crypto'),
      fs = require('fs'),
      express = require('express'),
      lunchdb = require('./lunchdb');

var key = fs.readFileSync('lunch.key').toString();
var cert = fs.readFileSync('lunch.crt').toString();

var credentials = crypto.createCredentials({key: key, cert: cert});

var app = express.createServer();

app.setSecure(credentials);

app.set('view options', {
    layout: false
});

var sendJson = function(json, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(json));
}

app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{status: ok}');
});

app.get('/users.:format?', function(req, res) {
    lunchdb.userNames(function(err, users) {
        if (req.params.format == 'json') {
            sendJson({ users: users }, res);
        } else if (req.params.format == 'txt') {
            res.render('txt/users.ejs', {
                locals: { users: users }
            });
        } else {
            res.render('html/users.ejs', {
                locals: { users: users}
            });
        }

        res.end();
    });
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
