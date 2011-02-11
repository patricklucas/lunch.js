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

mimetypes = {
    json: 'application/json',
    html: 'text/html',
    text: 'text/plain'
};

var writeHeadOk = function(res, mimetype) {
    mimetype = mimetype || 'html';
    res.writeHead(200, {'Content-Type': mimetypes[mimetype]});
}

var sendJson = function(json, res) {
    writeHeadOk(res, 'json');
    res.write(JSON.stringify(json));
};

var sendTxt = function(txt, res) {
    writeHeadOk(res, 'text');
    res.write(txt + '\n');
};

var nominations = function(req, res) {
    lunchdb.nominations(function(err, nominations) {
        if (isJson(req))
            sendJson(nominations, res);
        else {
            var format = isTxt(req) ? 'txt' : 'html';
            res.render(format + '/nominations.ejs', {
                locals: { nominations: nominations }
            });
        }

        res.end();
    });
}

var nominate = function(req, res) {
    var nomination = req.body['nomination'];

    lunchdb.nominate(nomination, function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isTxt(req)) {
            if (out.status == 'ok')
                sendTxt('Nomination for \'' + nomination + '\' successful.', res);
            else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var users = function(req, res) {
    lunchdb.userNames(function(err, users) {
        if (isJson(req)) {
            sendJson({ users: users }, res);
        } else {
            var format = isTxt(req) ? 'txt' : 'html';
            res.render(format + '/users.ejs', {
                locals: { users: users }
            });
        }

        res.end();
    });
}

var usersCount = function(req, res) {
    lunchdb.usersCount(function(err, count) {
        if (isJson(req)) {
            sendJson({ usersCount: count }, res);
        } else if (isTxt(req)) {
            sendTxt('Number of users: ' + count, res);
        } else {
            writeHeadOk(res);
            res.write('Number of users: <strong>' + count + '</strong>');
        }

        res.end();
    });
}

var reset = function(req, res) {
    lunchdb.reset(function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isTxt(req)) {
            if (out.status == 'ok')
                sendTxt('Database reset.', res);
            else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var drive = function(req, res) {
    var seats = req.body['seats'];

    lunchdb.drive(seats, function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isTxt(req)) {
            if (out.status == 'ok')
                sendTxt('You have ' + seats + ' seats available.', res);
            else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var vote = function(req, res) {
    var restaurant = req.body['restaurant'];

    lunchdb.vote(restaurant, function(err, change) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isTxt(req)) {
            if (out.status == 'ok') {
                if (!change.old)
                    sendTxt('Vote for \'' + change.new + '\' successful.', res);
                else if (change.old == change.new)
                    sendTxt('Vote for \'' + change.new + '\' unchanged.', res);
                else
                    sendTxt('Vote changed from \'' + change.old + '\' to \'' + change.new + '\'', res);
            } else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var unvote = function(req, res) {
    lunchdb.unvote(function(err, oldVote) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isTxt(req)) {
            if (out.status == 'ok') {
                if (oldVote)
                    sendTxt('No longer voting for \'' + oldVote + '\'.', res);
                else
                    sendTxt("You weren't voting for anything!", res);
            } else
                sendTxt(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

app.get('/', nominations)
app.get('/nominations.:format?', nominations)
app.post('/nominate.:format?', nominate)
app.get('/users.:format?', users)
app.get('/users/count.:format?', usersCount);
app.post('/reset.:format?', reset);
app.post('/drive.:format?', drive);
app.post('/vote.:format?', vote);
app.post('/unvote.:format?', unvote);

lunchdb.connect(function(err) {
    app.listen(8000);
});
