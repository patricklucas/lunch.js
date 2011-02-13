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
var isHtml = function(req) { return req.params.format == 'html'; };
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

var writeHead403 = function(res, mimetype) {
    mimetype = mimetype || 'html';
    res.writeHead(403, {'Content-Type': mimetypes[mimetype]});
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

var a = function(action) {
    return function(req, res) {
        var token = req.body['token'];
        
        lunchdb.auth(token, function(err, user) {
            if (user) {
                action(user, req, res);
            } else {
                forbidden(req, res);
            }
        });
    }
}

var root = function(req, res) {
    sendHtml('sup', res);
    res.end();
}

var register = function(req, res) {
    var username = req.body['username'];
    
    if (isHtml(req)) {
        res.redirect('/');
        res.end();
        return;
    }
    
    lunchdb.register(username, function(err, token) {
        var out = errOrOk(err);
        
        if (isJson(req))
            sendJson(out, res);
        else {
            if (out.status == 'ok')
                sendText('Token: ' + token, res);
            else
                sendText(out.error, res);
        }
        
        res.end();
    });
}

var nominations = function(user, req, res) {
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

var users = function(user, req, res) {
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

var usersCount = function(user, req, res) {
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

var nominate = function(user, req, res) {
    var restaurant = req.body['restaurant'];

    lunchdb.nominate(user, restaurant, function(err) {
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

var unnominate = function(user, req, res) {
    var restaurant = req.body['restaurant'];
    
    lunchdb.unnominate(user, restaurant, function(err, nomination) {
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

var reset = function(user, req, res) {
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

var drive = function(user, req, res) {
    var seats = req.body['seats'];

    lunchdb.drive(user, seats, function(err) {
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

var vote = function(user, req, res) {
    var restaurant = req.body['restaurant'];
    
    lunchdb.vote(user, restaurant, function(err, change) {
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

var unvote = function(user, req, res) {
    lunchdb.unvote(user, function(err, oldVote) {
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

var comment = function(user, req, res) {
    var comment = req.body['comment'];
    
    lunchdb.comment(user, comment, function(err, realComment) {
        var out = errOrOk(err);
        
        if (isJson(req))
            sendJson(out, res);
        else if (isText(req)) {
            if (out.status == 'ok') {
                if (comment)
                    sendText('Comment set to \'' + realComment + '\'.', res);
                else
                    sendText('Comment unset.', res);
            } else {
                sendText(out.error, res);
            }
        } else
            res.redirect('/');
        
        res.end();
    });
}

var forbidden = function(req, res) {
    if (isJson(req)) {
        writeHead403(res, 'json');
        res.write(JSON.stringify({status: error, error: "403 Forbidden"}));
    } else if (isText(req)) {
        writeHead403(res, 'text');
        res.write("403 Forbidden\n");
    } else {
        writeHead403(res, 'html');
        res.write("<h1>403 Forbidden</h1>");
    }
    
    res.end();
}

app.post('/register.:format?',      register);
app.get('/',                        root);

app.post('/nominations.:format?',   a(nominations));
app.post('/users.:format?',         a(users));
app.post('/users/count.:format?',   a(usersCount));
app.post('/nominate.:format?',      a(nominate));
app.post('/unnominate.:format?',    a(unnominate));
app.post('/reset.:format?',         a(reset));
app.post('/drive.:format?',         a(drive));
app.post('/vote.:format?',          a(vote));
app.post('/unvote.:format?',        a(unvote));
app.post('/comment.:format?',       a(comment));

lunchdb.connect(function(err) {
    if (err) {
        console.log(err);
    } else {
        app.listen(8000);
    }
});
