const crypto = require('crypto'),
      fs = require('fs'),
      express = require('express'),
      lunchdb = require('./lunchdb');

var key = fs.readFileSync('lunch.key').toString();
var cert = fs.readFileSync('lunch.crt').toString();

var credentials = crypto.createCredentials({key: key, cert: cert});

var app = express.createServer();

app.use(express.bodyDecoder());

app.setSecure(credentials);

app.set('view options', {
    layout: false
});

var isJson = function(req) { return req.params.format == 'json'; };
var isTxt = function(req) { return req.params.format == 'txt'; };
var errOrOk = function(err) {
    return (!!err) ? { status: 'error', error: err } : { status: 'ok' };
}

var sendJson = function(json, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(json));
}

var sendTxt = function(txt, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(txt + '\n');
}

app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{status: ok}');
});

app.get('/nominations.:format?', function(req, res) {
    lunchdb.nominations(function(err, nominations) {
        if (isJson(req))
            sendJson(nominations);
        else {
            var format = isTxt(req) ? 'txt' : 'html';
            res.render(format + '/nominations.ejs', {
                locals: { nominations: nominations }
            });
        }

        res.end();
    });
});

app.post('/nominate.:format?', function(req, res) {
    var nomination = req.body['nomination'];

    lunchdb.nominate(nomination, function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out);
        else if (isTxt(req)) {
            if (out.status == 'ok')
                sendTxt('Nomination for \'' + nomination + '\' successful.', res);
            else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
});

app.get('/users.:format?', function(req, res) {
    lunchdb.userNames(function(err, users) {
        if (isJson(req)) {
            sendJson({ users: users }, res);
        } else if (isTxt(req)) {
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
