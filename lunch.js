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
var isText = function(req) { return req.params.format == 'txt'; };
var isBash = function(req) { return req.params.format == 'bash'; };

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

var sendText = function(text, res) {
    writeHeadOk(res, 'text');
    res.write(text + '\n');
};

var sendHtml = function(html, res) {
    writeHeadOk(res, 'html');
    res.write(html + '\n');
};

var formatBash = function(nominations) {
    restaurants = [];

    nominations.forEach(function(nomination) {
        restaurants.push(nomination.where);

        /* Attempt to make completion case-insensitive */
        /*
        restaurant = nomination.where;

        restaurants.push(restaurant.charAt(0).toUpperCase() + restaurant.slice(1));
        restaurants.push(restaurant.charAt(0).toLowerCase() + restaurant.slice(1));
        */
    });

    return "'" + restaurants.join("' '") + "'";
}

var nominations = function(req, res) {
    lunchdb.nominations(function(err, nominations) {
        if (isJson(req)) {
            sendJson(nominations, res);
        } else if (isBash(req)) {
            sendText(formatBash(nominations), res);
        } else {
            var format = isText(req) ? 'txt' : 'html';
            res.render(format + '/nominations.ejs', {
                locals: { nominations: nominations }
            });
        }

        res.end();
    });
}

var users = function(req, res) {
    lunchdb.userNames(function(err, users) {
        if (isJson(req)) {
            sendJson({ users: users }, res);
        } else {
            var format = isText(req) ? 'txt' : 'html';
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
        } else if (isText(req)) {
            sendText('Number of users: ' + count, res);
        } else {
            sendHtml('Number of users: <strong>' + count + '</strong>');
        }

        res.end();
    });
}

var nominate = function(req, res) {
    var restaurant = req.body['restaurant'];

    lunchdb.nominate(restaurant, function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isText(req)) {
            if (out.status == 'ok')
                sendText('Nomination for \'' + restaurant + '\' successful.', res);
            else
                sendText(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var unnominate = function(req, res) {
    var restaurant = req.body['restaurant'];
    
    lunchdb.unnominate(restaurant, function(err, nomination) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isText(req)) {
            if (out.status == 'ok')
                sendText('Nomination for \'' + nomination + '\' removed.', res);
            else
                sendText(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var reset = function(req, res) {
    lunchdb.reset(function(err) {
        var out = errOrOk(err);

        if (isJson(req))
            sendJson(out, res);
        else if (isText(req)) {
            if (out.status == 'ok')
                sendText('Database reset.', res);
            else
                sendText(out.error, res);
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
        else if (isText(req)) {
            if (out.status == 'ok')
                sendText('You have ' + seats + ' seats available.', res);
            else
                sendText(out.error, res);
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
        else if (isText(req)) {
            if (out.status == 'ok') {
                if (!change.old)
                    sendText('Vote for \'' + change.new + '\' successful.', res);
                else if (change.old == change.new)
                    sendText('Vote for \'' + change.new + '\' unchanged.', res);
                else
                    sendText('Vote changed from \'' + change.old + '\' to \'' + change.new + '\'.', res);
            } else {
                sendText(out.error, res);
            }
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
        else if (isText(req)) {
            if (out.status == 'ok') {
                if (oldVote)
                    sendText('No longer voting for \'' + oldVote + '\'.', res);
                else
                    sendText("You weren't voting for anything!", res);
            } else
                sendText(out.error, res);
        } else
            res.redirect('/');

        res.end();
    });
}

var comment = function(req, res) {
    var comment = req.body['comment'];
    
    lunchdb.comment(comment, function(err, realComment) {
        var out = errOrOk(err);
        
        if (isJson(req))
            sendJson(out, res);
        else if (isText(req)) {
            if (out.status == 'ok') {
                sendText('Comment set to \'' + realComment + '\'.', res);
            } else {
                sendText(out.error, res);
            }
        } else
            res.redirect('/');
        
        res.end();
    });
}

app.get('/', nominations);
app.get('/nominations.:format?', nominations);
app.get('/users.:format?', users);
app.get('/users/count.:format?', usersCount);
app.post('/nominate.:format?', nominate);
app.post('/unnominate.:format?', unnominate);
app.post('/reset.:format?', reset);
app.post('/drive.:format?', drive);
app.post('/vote.:format?', vote);
app.post('/unvote.:format?', unvote);
app.post('/comment.:format?', comment);

lunchdb.connect(function(err) {
    if (err) {
        console.log(err);
    } else {
        app.listen(8000);
    }
});
